import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notifyUser } from "@/lib/socket";
import { sendNotificationEmail, type Locale } from "@/lib/email";

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
      // Atomic guard: updateMany with the PENDING predicate makes two
      // racing accepts (double-click, two devices) resolve to exactly one
      // winner — the loser's count is 0 and no orphan conversation is
      // created. The whole accept is one transaction so a failure can't
      // leave a conversation without an accepted connection.
      const conversation = await prisma.$transaction(async (tx) => {
        const claimed = await tx.connection.updateMany({
          where: { id, status: "PENDING" },
          data: { status: "ACCEPTED" },
        });
        if (claimed.count === 0) return null;
        const conv = await tx.conversation.create({
          data: {
            participants: {
              connect: [
                { id: session.user.id },
                { id: connection.requesterId },
              ],
            },
          },
        });
        await tx.connection.update({
          where: { id },
          data: { conversationId: conv.id },
        });
        return conv;
      });

      if (!conversation) {
        return NextResponse.json({ error: "Connection already resolved" }, { status: 400 });
      }

      notifyUser(connection.requesterId);
      // Email the requester — acceptance is the moment the loop most
      // often dies (they've closed the tab by now). Never fails the request.
      try {
        const requester = await prisma.user.findUnique({
          where: { id: connection.requesterId },
          select: { email: true, preferredLanguage: true },
        });
        if (requester) {
          await sendNotificationEmail(
            "interestAccepted",
            requester.email,
            (requester.preferredLanguage as Locale) || "en",
            { title: connection.post.title, path: `/chat/${conversation.id}` },
          );
        }
      } catch (err) {
        console.error("[connections] accept email failed:", err);
      }
      return NextResponse.json({ ...connection, status: "ACCEPTED", conversationId: conversation.id });
    }

    const updated = await prisma.connection.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("[connections PATCH error]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
