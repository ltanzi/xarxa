import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notifyUser } from "@/lib/socket";
import { connectionRequestSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = connectionRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { postId } = parsed.data;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.closed) {
      return NextResponse.json({ error: "Post is closed" }, { status: 400 });
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

    // Notify the post author about the new connection request
    notifyUser(post.authorId);
    return NextResponse.json(connection, { status: 201 });
  } catch (e) {
    console.error("[connections POST error]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
