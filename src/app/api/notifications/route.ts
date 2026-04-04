import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ unreadMessages: 0, pendingConnections: 0 });
  }

  const [unreadMessages, pendingConnections, acceptedRequests] = await Promise.all([
    prisma.message.count({
      where: {
        conversation: { participants: { some: { id: session.user.id } } },
        senderId: { not: session.user.id },
        read: false,
      },
    }),
    prisma.connection.count({
      where: {
        post: { authorId: session.user.id },
        status: "PENDING",
      },
    }),
    prisma.connection.count({
      where: {
        requesterId: session.user.id,
        status: "ACCEPTED",
        seenByRequester: false,
      },
    }),
  ]);

  return NextResponse.json({ unreadMessages, pendingConnections, acceptedRequests });
}
