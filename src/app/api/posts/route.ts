import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { postSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const category = searchParams.get("category");
  const location = searchParams.get("location");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};

  if (type && (type === "OFFER" || type === "REQUEST")) {
    where.type = type;
  }
  if (category) {
    where.category = category;
  }
  if (location) {
    where.location = { contains: location, mode: "insensitive" };
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, type: true, profilePhoto: true } },
    },
  });

  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        ...parsed.data,
        tags: parsed.data.tags || [],
        isRemote: parsed.data.isRemote || false,
        authorId: session.user.id,
      },
      include: {
        author: { select: { id: true, name: true, type: true, profilePhoto: true } },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
