import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail, type Locale } from "@/lib/email";
import { limit, rateLimited } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: unknown };
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  }

  const per1m = limit(`resend:1m:${email}`, 1, 60 * 1000);
  const per1h = limit(`resend:1h:${email}`, 5, 60 * 60 * 1000);
  if (!per1m.ok || !per1h.ok) {
    const retry = Math.max(
      per1m.ok ? 0 : per1m.retryAfterSec,
      per1h.ok ? 0 : per1h.retryAfterSec,
    );
    return rateLimited(retry);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Don't reveal whether the email exists; respond OK either way.
  if (!user) return NextResponse.json({ ok: true });
  if (user.emailVerified) return NextResponse.json({ ok: true });

  // One active token at a time per identifier.
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  const plainToken = randomBytes(32).toString("base64url");
  const hashedToken = createHash("sha256").update(plainToken).digest("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: { identifier: email, token: hashedToken, expires },
  });

  const locale = (["en", "es", "ca"].includes(user.preferredLanguage ?? "")
    ? (user.preferredLanguage as Locale)
    : "en");
  try {
    await sendVerificationEmail(email, locale, plainToken);
  } catch (err) {
    console.error("[resend-verification] send failed", err);
    return NextResponse.json({ error: "SEND_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
