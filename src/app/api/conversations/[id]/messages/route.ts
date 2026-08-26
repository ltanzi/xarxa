import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireVerifiedUser } from "@/lib/auth-utils";
import { messageSchema } from "@/lib/validations";
import { limit, rateLimited } from "@/lib/rate-limit";
import { emitToUser, notifyUser } from "@/lib/socket";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      participants: { some: { id: session.user.id } },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true, profilePhoto: true } },
    },
  });

  await prisma.message.updateMany({
    where: {
      conversationId: id,
      senderId: { not: session.user.id },
      read: false,
    },
    data: { read: true },
  });

  return NextResponse.json(messages);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Soft-wall: only verified users can send messages via REST too. The
  // Socket.io send-message handler enforces the same gate; this is the
  // load-bearing one because the chat client posts here first.
  const { error, session } = await requireVerifiedUser();
  if (error) return error;

  const rl = limit(`msg:${session.user.id}`, 20, 60 * 1000);
  if (!rl.ok) return rateLimited(rl.retryAfterSec);

  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      participants: { some: { id: session.user.id } },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = messageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const message = await prisma.message.create({
    data: {
      content: parsed.data.content,
      conversationId: id,
      senderId: session.user.id,
    },
    include: {
      sender: { select: { id: true, name: true, profilePhoto: true } },
    },
  });

  // Real-time delivery happens HERE, server-side, because this route is
  // the authority (membership-checked, validated, persisted). The message
  // is emitted to every participant's personal user:{id} room — including
  // the sender, so their other open tabs stay in sync (the sending tab
  // dedupes by id). Conversation rooms and the client-side relay were
  // removed: the old join-conversation handler needed a prisma import
  // that doesn't exist in the standalone build, so rooms silently never
  // joined in prod and no message ever relayed live.
  const fullConv = await prisma.conversation.findUnique({
    where: { id },
    select: { participants: { select: { id: true } } },
  });
  if (fullConv) {
    for (const p of fullConv.participants) {
      emitToUser(p.id, "new-message", { conversationId: id, message });
      if (p.id !== session.user.id) notifyUser(p.id);
    }
  }

  return NextResponse.json(message, { status: 201 });
}
