import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations";
import { limit, ipKey, rateLimited } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rl = limit(`reset:${ipKey(request)}`, 20, 60 * 60 * 1000);
  if (!rl.ok) return rateLimited(rl.retryAfterSec);

  const body = await request.json().catch(() => ({}));
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((e) => {
      if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
    });
    return NextResponse.json({ error: "VALIDATION", fields: fieldErrors }, { status: 400 });
  }

  const { token, password } = parsed.data;
  const hashedToken = createHash("sha256").update(token).digest("hex");

  try {
    const row = await prisma.passwordResetToken.findUnique({ where: { token: hashedToken } });
    if (!row) {
      return NextResponse.json({ error: "INVALID" }, { status: 400 });
    }
    if (row.expires < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token: hashedToken } });
      return NextResponse.json({ error: "EXPIRED" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Atomic consume + update: delete the token in the same transaction
    // as the password update so a failed update never leaves a "used"
    // token without a corresponding password change. Delete-on-consume
    // matches the existing VerificationToken convention.
    await prisma.$transaction([
      prisma.user.update({
        where: { id: row.userId },
        data: { password: passwordHash },
      }),
      prisma.passwordResetToken.delete({ where: { token: hashedToken } }),
    ]);
  } catch (err) {
    console.error("[reset-password] consume failed", { err });
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
