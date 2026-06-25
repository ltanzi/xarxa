import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

// GET preserved as a redirect-only handler for backwards-compatibility
// with any verification emails sent before the interstitial page existed.
// It never mutates state — corporate email scanners (Outlook Safe Links,
// Defender etc.) routinely pre-fetch GET URLs and would burn the token
// before the user clicked. The interstitial /auth/verify page submits
// POST to consume the token.
export async function GET(req: NextRequest) {
  const plainToken = req.nextUrl.searchParams.get("token");
  if (!plainToken) {
    return NextResponse.redirect(`${env.NEXTAUTH_URL}/auth/verify-pending?error=missing`);
  }
  return NextResponse.redirect(
    `${env.NEXTAUTH_URL}/auth/verify?token=${encodeURIComponent(plainToken)}`,
  );
}

export async function POST(req: NextRequest) {
  // Token comes from a form submission on /auth/verify
  let plainToken: string | null = null;
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const t = form.get("token");
    if (typeof t === "string") plainToken = t;
  } else if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as { token?: unknown };
    if (typeof body.token === "string") plainToken = body.token;
  }

  if (!plainToken) {
    return NextResponse.redirect(`${env.NEXTAUTH_URL}/auth/verify-pending?error=missing`, 303);
  }

  const hashedToken = createHash("sha256").update(plainToken).digest("hex");
  try {
    const row = await prisma.verificationToken.findUnique({ where: { token: hashedToken } });

    if (!row) {
      return NextResponse.redirect(`${env.NEXTAUTH_URL}/auth/verify-pending?error=invalid`, 303);
    }
    if (row.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token: hashedToken } });
      return NextResponse.redirect(`${env.NEXTAUTH_URL}/auth/verify-pending?error=expired`, 303);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { email: row.identifier },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({ where: { token: hashedToken } }),
    ]);
  } catch (err) {
    console.error("[verify-email] consume failed", { hashedToken, err });
    return NextResponse.redirect(`${env.NEXTAUTH_URL}/auth/verify-pending?error=server`, 303);
  }

  return NextResponse.redirect(`${env.NEXTAUTH_URL}/?verified=1`, 303);
}
