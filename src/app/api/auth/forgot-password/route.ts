import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { sendPasswordResetEmail, type Locale } from "@/lib/email";
import { limit, ipKey, rateLimited } from "@/lib/rate-limit";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Anti-enumeration: always return 200 with the same body, regardless of
// whether the email matched an account. The email is sent only if a user
// exists AND has a password (OAuth-only accounts can't reset; they have
// nothing to reset). Token TTL is 1 hour; old tokens for the same user
// are wiped so only the latest link works.
export async function POST(request: NextRequest) {
  const rl = limit(`forgot:${ipKey(request)}`, 5, 60 * 60 * 1000);
  if (!rl.ok) return rateLimited(rl.retryAfterSec);

  const body = await request.json().catch(() => ({}));
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    // Same 200 to keep timing/output identical regardless of input shape.
    return NextResponse.json({ ok: true });
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true, preferredLanguage: true },
    });

    if (user?.password) {
      const plainToken = randomBytes(32).toString("hex");
      const hashedToken = createHash("sha256").update(plainToken).digest("hex");
      const expires = new Date(Date.now() + TOKEN_TTL_MS);

      // Invalidate older tokens for this user — only the most recent
      // request's link should work.
      await prisma.$transaction([
        prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
        prisma.passwordResetToken.create({
          data: { token: hashedToken, userId: user.id, expires },
        }),
      ]);

      const locale: Locale = (user.preferredLanguage as Locale) || "en";
      await sendPasswordResetEmail(email, locale, plainToken);
    }
  } catch (err) {
    console.error("[forgot-password] failed", { email, err });
    // Still return ok — the user shouldn't learn anything from a server-side
    // failure either. Errors are surfaced to Sentry server-side.
  }

  return NextResponse.json({ ok: true });
}
