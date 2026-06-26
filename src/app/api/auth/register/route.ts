import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { sendVerificationEmail, type Locale } from "@/lib/email";
import { limit, ipKey, rateLimited } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rl = limit(`register:${ipKey(request)}`, 5, 60 * 60 * 1000);
  if (!rl.ok) return rateLimited(rl.retryAfterSec);

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, name, surname, type, preferredLanguage } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "EMAIL_EXISTS" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        ...(surname && { surname }),
        type,
        ...(preferredLanguage && { preferredLanguage }),
      },
    });

    const plainToken = randomBytes(32).toString("base64url");
    const hashedToken = createHash("sha256").update(plainToken).digest("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: { identifier: user.email, token: hashedToken, expires },
    });

    const locale = (["en", "es", "ca"].includes(preferredLanguage ?? "")
      ? (preferredLanguage as Locale)
      : "en");
    try {
      await sendVerificationEmail(user.email, locale, plainToken);
    } catch (err) {
      console.error("[register] verification email send failed", err);
      // user is created; client can resend from /auth/verify-pending
    }

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    );
  } catch (error) {
    console.error("[register]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
