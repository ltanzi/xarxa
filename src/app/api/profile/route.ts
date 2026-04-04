import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validations";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: parsed.data,
    });

    revalidatePath(`/profile/${session.user.id}`);
    return NextResponse.json(user);
  } catch (e) {
    console.error("[profile PATCH error]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Messages sent by user
      await tx.message.deleteMany({ where: { senderId: userId } });

      // 2. Connections where user is requester (and their conversations/messages)
      const requesterConns = await tx.connection.findMany({
        where: { requesterId: userId },
        select: { conversationId: true },
      });
      const requesterConvIds = requesterConns.map((c) => c.conversationId).filter(Boolean) as string[];

      await tx.connection.deleteMany({ where: { requesterId: userId } });

      // 3. Connections on user's posts (and their conversations/messages)
      const postIds = (await tx.post.findMany({ where: { authorId: userId }, select: { id: true } })).map((p) => p.id);
      let postConvIds: string[] = [];
      if (postIds.length > 0) {
        const postConns = await tx.connection.findMany({
          where: { postId: { in: postIds } },
          select: { conversationId: true },
        });
        postConvIds = postConns.map((c) => c.conversationId).filter(Boolean) as string[];
        await tx.connection.deleteMany({ where: { postId: { in: postIds } } });
      }

      // 4. Clean up orphaned conversations and their messages
      const allConvIds = Array.from(new Set([...requesterConvIds, ...postConvIds]));
      if (allConvIds.length > 0) {
        await tx.message.deleteMany({ where: { conversationId: { in: allConvIds } } });
        await tx.conversation.deleteMany({ where: { id: { in: allConvIds } } });
      }

      // 5. Posts by user
      await tx.post.deleteMany({ where: { authorId: userId } });

      // 6. Disconnect user from any remaining conversations (e.g. conversations not tied to connections)
      const remaining = await tx.conversation.findMany({
        where: { participants: { some: { id: userId } } },
        select: { id: true },
      });
      for (const conv of remaining) {
        await tx.conversation.update({
          where: { id: conv.id },
          data: { participants: { disconnect: { id: userId } } },
        });
      }

      // 7. Delete user
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[profile DELETE error]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
