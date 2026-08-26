import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Mark everything the other side sent as read. Called by ChatRoom when a
// message arrives while the conversation is open — read-marking used to
// happen only at page load, so the navbar unread badge stayed lit while
// the user was literally looking at the message (and the offline-email
// batching in the messages POST relies on read state being truthful).
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: { id, participants: { some: { id: session.user.id } } },
    select: { id: true },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  await prisma.message.updateMany({
    where: { conversationId: id, senderId: { not: session.user.id }, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
