import { prisma } from "@/lib/prisma";
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
    <div className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-28 pb-20">
      <div className="flex items-end justify-between mb-20">
        <h1 className="font-display text-5xl sm:text-6xl font-300 tracking-tight animate-in">Board</h1>
        <Link href="/board/new" className="font-label text-muted hover:text-accent transition-colors duration-300">
          + New post
        </Link>
      </div>
      <PostFilters />
      {posts.length === 0 ? (
        <p className="text-muted text-sm py-20">No posts found.</p>
      ) : (
        <div>
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/board/${post.id}`}
              className="group block border-t border-fg/8 py-7"
            >
              <div className="grid grid-cols-12 gap-4 items-baseline">
                <span className="col-span-2 lg:col-span-1 font-label text-muted">
                  {post.type}
                </span>
                <span className="col-span-10 sm:col-span-6 lg:col-span-7 font-display text-2xl sm:text-3xl font-300 group-hover:text-accent transition-colors duration-300">
                  {post.title}
                </span>
                <span className="hidden sm:block col-span-2 font-label text-muted text-right">
                  {post.category.replace("_", " ")}
                </span>
                <span className="hidden lg:block col-span-2 text-sm text-muted text-right">
                  {post.author.name}
                </span>
              </div>
            </Link>
          ))}
          <div className="border-t border-fg/8" />
        </div>
      )}
    </div>
  );
}
