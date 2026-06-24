import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "./auth";

export async function getSession() {
  return await auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}

type RequireResult =
  | { error: null; session: Session & { user: { id: string; emailVerified: Date } } }
  | { error: NextResponse; session: null };

export async function requireVerifiedUser(): Promise<RequireResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }),
      session: null,
    };
  }
  if (!session.user.emailVerified) {
    return {
      error: NextResponse.json({ error: "EMAIL_NOT_VERIFIED" }, { status: 403 }),
      session: null,
    };
  }
  return {
    error: null,
    session: session as Session & { user: { id: string; emailVerified: Date } },
  };
}
