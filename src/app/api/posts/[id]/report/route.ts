import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { reportSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;
  const reporterId = session.user.id;

  try {
    const body = await request.json();
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (post.authorId === reporterId) {
      return NextResponse.json({ error: "Cannot report your own post" }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        postId,
        reporterId,
        reason: parsed.data.reason,
        details: parsed.data.details || null,
      },
    });

    return NextResponse.json({ id: report.id });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Already reported" }, { status: 409 });
    }
    console.error("[report POST error]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
