import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { status } = await request.json();

    if (status !== "ACCEPTED" && status !== "REJECTED") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const connection = await prisma.connection.findUnique({
      where: { id },
      include: { post: true },
    });

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    if (connection.post.authorId !== session.user.id) {
      return NextResponse.json({ error: "Only the post author can manage connections" }, { status: 403 });
    }

    if (connection.status !== "PENDING") {
      return NextResponse.json({ error: "Connection already resolved" }, { status: 400 });
    }

    if (status === "ACCEPTED") {
      const conversation = await prisma.conversation.create({
        data: {
          participants: {
            connect: [
              { id: session.user.id },
              { id: connection.requesterId },
            ],
          },
        },
      });

      const updated = await prisma.connection.update({
        where: { id },
        data: { status: "ACCEPTED", conversationId: conversation.id },
      });

      return NextResponse.json(updated);
    }

    const updated = await prisma.connection.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
