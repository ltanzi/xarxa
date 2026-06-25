import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { limit } from "./rate-limit";

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
        const email = credentials.email as string;
        const password = credentials.password as string;

        if (!email || !password) return null;

        const ip =
          request?.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
          request?.headers.get("x-real-ip") ??
          "unknown";
        const ipLimit = limit(`signin:ip:${ip}`, 10, 60 * 60 * 1000);
        const emailLimit = limit(`signin:em:${email}`, 5, 60 * 60 * 1000);
        if (!ipLimit.ok || !emailLimit.ok) {
          console.warn("[auth] sign-in rate limited", { ip, email });
          throw new RateLimitedSigninError();
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

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
        // JWT serialises Date → ISO string via JSON.stringify on the way
        // out, then JSON.parse on the way back in. Store ISO string up
        // front so the runtime type stays consistent.
        const raw = (user as { emailVerified?: Date | null }).emailVerified;
        token.emailVerified = raw ? raw.toISOString() : null;
      }
      if (trigger === "update" && token.id) {
        // Refresh emailVerified from DB when a route calls session.update()
        // after verification.
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { emailVerified: true },
        });
        token.emailVerified = fresh?.emailVerified ? fresh.emailVerified.toISOString() : null;
      }
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
