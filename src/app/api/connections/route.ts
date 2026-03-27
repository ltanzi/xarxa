import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { postId } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId === session.user.id) {
      return NextResponse.json({ error: "Cannot connect to your own post" }, { status: 400 });
    }

    const existing = await prisma.connection.findUnique({
      where: { postId_requesterId: { postId, requesterId: session.user.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Already expressed interest" }, { status: 409 });
    }

    const connection = await prisma.connection.create({
      data: {
        postId,
        requesterId: session.user.id,
      },
    });

    return NextResponse.json(connection, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
