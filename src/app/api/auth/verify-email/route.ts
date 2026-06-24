import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
  const plainToken = req.nextUrl.searchParams.get("token");
  if (!plainToken) {
    return NextResponse.redirect(`${env.NEXTAUTH_URL}/auth/verify-pending?error=missing`);
  }

  const hashedToken = createHash("sha256").update(plainToken).digest("hex");
  const row = await prisma.verificationToken.findUnique({ where: { token: hashedToken } });

  if (!row) {
    return NextResponse.redirect(`${env.NEXTAUTH_URL}/auth/verify-pending?error=invalid`);
  }
  if (row.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token: hashedToken } });
    return NextResponse.redirect(`${env.NEXTAUTH_URL}/auth/verify-pending?error=expired`);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email: row.identifier },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token: hashedToken } }),
  ]);

  return NextResponse.redirect(`${env.NEXTAUTH_URL}/?verified=1`);
}
