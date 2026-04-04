import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.connection.updateMany({
    where: {
      requesterId: session.user.id,
      status: "ACCEPTED",
      seenByRequester: false,
    },
    data: { seenByRequester: true },
  });

  return NextResponse.json({ ok: true });
}
