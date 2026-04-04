import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { postSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, surname: true, type: true, profilePhoto: true, location: true } },
      connections: {
        select: { id: true, requesterId: true, status: true },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

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
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (post.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Toggle closed status
    if ("closed" in body && Object.keys(body).length === 1) {
      const updated = await prisma.post.update({
        where: { id },
        data: { closed: !!body.closed },
      });
      return NextResponse.json(updated);
    }

    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const updated = await prisma.post.update({
      where: { id },
      data: {
        ...parsed.data,
        tags: parsed.data.tags || [],
        isRemote: parsed.data.isRemote || false,
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("[post PATCH error]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (post.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      const connections = await tx.connection.findMany({
        where: { postId: id },
        select: { conversationId: true },
      });
      const convIds = connections.map((c) => c.conversationId).filter(Boolean) as string[];

      await tx.connection.deleteMany({ where: { postId: id } });

      if (convIds.length > 0) {
        await tx.message.deleteMany({ where: { conversationId: { in: convIds } } });
        await tx.conversation.deleteMany({ where: { id: { in: convIds } } });
      }

      await tx.post.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[post DELETE error]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
