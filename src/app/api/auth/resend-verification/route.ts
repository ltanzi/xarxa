import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail, type Locale } from "@/lib/email";
import { limit, refund, rateLimited } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: unknown };
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  }

  // Consume both buckets up-front; if either is over, refund the other so
  // the user isn't double-penalised.
  const key1m = `resend:1m:${email}`;
  const key1h = `resend:1h:${email}`;
  const per1m = limit(key1m, 1, 60 * 1000);
  const per1h = limit(key1h, 5, 60 * 60 * 1000);
  if (!per1m.ok || !per1h.ok) {
    if (per1m.ok) refund(key1m);
    if (per1h.ok) refund(key1h);
    const retry = Math.max(
      per1m.ok ? 0 : per1m.retryAfterSec,
      per1h.ok ? 0 : per1h.retryAfterSec,
    );
    return rateLimited(retry);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Don't reveal whether the email exists; respond OK either way.
  // (Note: timing differs between found-vs-not-found paths — accepted trade-off.)
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
    // Refund both buckets — the user shouldn't be blocked from retrying
    // when our infra failed to send.
    refund(key1m);
    refund(key1h);
    return NextResponse.json({ error: "SEND_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
