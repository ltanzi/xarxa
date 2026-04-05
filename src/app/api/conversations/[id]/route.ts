import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        participants: { some: { id: session.user.id } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Disconnect the connection that references this conversation
      await tx.connection.updateMany({
        where: { conversationId: id },
        data: { conversationId: null },
      });

      await tx.message.deleteMany({ where: { conversationId: id } });
      await tx.conversation.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[conversations DELETE error]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
