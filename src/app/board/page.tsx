import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/posts/PostCard";
import { PostFilters } from "@/components/posts/PostFilters";
import { Prisma } from "@prisma/client";
import Link from "next/link";

interface BoardPageProps {
  searchParams: Promise<{
    type?: string;
    category?: string;
    location?: string;
    search?: string;
  }>;
}

export default async function BoardPage({ searchParams }: BoardPageProps) {
  const params = await searchParams;
  const where: Prisma.PostWhereInput = {};

  if (params.type === "OFFER" || params.type === "REQUEST") {
    where.type = params.type;
  }
  if (params.category) {
    where.category = params.category as Prisma.EnumCategoryFilter;
  }
  if (params.location) {
    where.location = { contains: params.location, mode: "insensitive" };
  }
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, type: true, profilePhoto: true } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-6 lg:px-8 pt-24 pb-16">
      <div className="flex items-baseline justify-between mb-12">
        <h1 className="text-3xl font-light">Board</h1>
        <Link href="/board/new" className="text-sm underline underline-offset-4 hover:no-underline">
          New post
        </Link>
      </div>
      <PostFilters />
      {posts.length === 0 ? (
        <p className="text-muted text-sm py-20">No posts found.</p>
      ) : (
        <div className="border-t border-fg/10">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
