import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { limit, refund } from "./rate-limit";

// Distinct error class so the sign-in form can show "wait, you're rate
// limited" instead of generic "invalid credentials".
class RateLimitedSigninError extends CredentialsSignin {
  code = "rate_limit";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials, request) {
        // Same normalization as emailSchema (validations.ts) — the DB
        // stores emails lowercased, so the lookup must match.
        const email = (credentials.email as string | undefined)?.trim().toLowerCase();
        const password = credentials.password as string;

        if (!email || !password) return null;

        const ip =
          request?.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
          request?.headers.get("x-real-ip") ??
          "unknown";
        const ipKey = `signin:ip:${ip}`;
        const emailKey = `signin:em:${email}`;
        const ipLimit = limit(ipKey, 10, 60 * 60 * 1000);
        const emailLimit = limit(emailKey, 5, 60 * 60 * 1000);
        if (!ipLimit.ok || !emailLimit.ok) {
          console.warn("[auth] sign-in rate limited", { ip, email });
          throw new RateLimitedSigninError();
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        // Only FAILED attempts should count against the buckets — without
        // this, five successful sign-ins in an hour locked the account
        // out with valid credentials.
        refund(ipKey);
        refund(emailKey);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
        };
      },
    }),
    // Google({
    //   clientId: process.env.GOOGLE_CLIENT_ID,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Google OAuth: trust Google's email verification; mark our user verified
      // on first OAuth sign-in. (Currently dead code — Google provider is disabled —
      // but in place so it Just Works when the provider is re-enabled.)
      if (account?.provider === "google" && (profile as { email_verified?: boolean })?.email_verified && user.email) {
        await prisma.user.update({
          where: { email: user.email },
          data: { emailVerified: new Date() },
        }).catch(() => null);
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        // Our own issued-at stamp (ms). The standard `iat` claim is not
        // reliably present on the token object this callback receives,
        // so revocation-on-password-change compares against this instead.
        token.authTime = Date.now();
        // JWT serialises Date → ISO string via JSON.stringify on the way
        // out, then JSON.parse on the way back in. Store ISO string up
        // front so the runtime type stays consistent.
        const raw = (user as { emailVerified?: Date | null }).emailVerified;
        token.emailVerified = raw ? raw.toISOString() : null;
      }
      // One DB read per session decode, doing two jobs:
      //
      // 1. Session revocation on password change: a JWT issued before the
      //    user's passwordChangedAt is rejected (return null → signed out).
      //    This is THE account-recovery guarantee — when a victim resets
      //    their password because an attacker got in, the attacker's
      //    stolen session dies too. The 2s grace absorbs iat's
      //    second-granularity around the reset→sign-in sequence itself.
      //    A deleted user's token dies the same way.
      //
      // 2. Self-heal for unverified users: the moment they click the
      //    verify link, their next page load picks up the fresh state —
      //    no client-side update() coordination needed.
      if (token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { emailVerified: true, passwordChangedAt: true },
        });
        if (!fresh) return null;
        if (fresh.passwordChangedAt) {
          // Tokens from before this code shipped have no authTime — treat
          // them as pre-change (0) and revoke; a legit user just signs in
          // again. The 2s grace absorbs the reset→sign-in sequence itself.
          const authTime = typeof token.authTime === "number" ? token.authTime : 0;
          if (authTime < fresh.passwordChangedAt.getTime() - 2000) {
            return null;
          }
        }
        if (!token.emailVerified && fresh.emailVerified) {
          token.emailVerified = fresh.emailVerified.toISOString();
        }
      }
      // Explicit update() from the client (e.g. VerifiedToast on /?verified=1)
      // also goes through here with trigger="update"; the self-heal above
      // covers it so no additional branch is needed.
      void trigger;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // emailVerified arrives as ISO string from the JWT.
        const raw = token.emailVerified as string | null | undefined;
        session.user.emailVerified = raw ?? null;
      }
      return session;
    },
  },
});
