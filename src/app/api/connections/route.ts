import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/auth-utils";
import { notifyUser } from "@/lib/socket";
import { connectionRequestSchema } from "@/lib/validations";
import { limit, rateLimited } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const { error, session } = await requireVerifiedUser();
  if (error) return error;

  const rl = limit(`conn:${session.user.id}`, 30, 24 * 60 * 60 * 1000);
  if (!rl.ok) return rateLimited(rl.retryAfterSec);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
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
