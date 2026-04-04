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
    // Delete in order to respect foreign key constraints
    // 1. Messages sent by user
    await prisma.message.deleteMany({ where: { senderId: userId } });

    // 2. Connections where user is requester
    await prisma.connection.deleteMany({ where: { requesterId: userId } });

    // 3. Connections on user's posts (other people's requests to this user)
    const postIds = (await prisma.post.findMany({ where: { authorId: userId }, select: { id: true } })).map((p) => p.id);
    if (postIds.length > 0) {
      await prisma.connection.deleteMany({ where: { postId: { in: postIds } } });
    }

    // 4. Posts by user
    await prisma.post.deleteMany({ where: { authorId: userId } });

    // 5. Remove user from conversations (many-to-many)
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { id: userId } } },
      select: { id: true },
    });
    for (const conv of conversations) {
      await prisma.conversation.update({
        where: { id: conv.id },
        data: { participants: { disconnect: { id: userId } } },
      });
    }

    // 6. Delete user
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[profile DELETE error]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
