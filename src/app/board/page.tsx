import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/posts/PostCard";
import { PostFilters } from "@/components/posts/PostFilters";
import { Prisma } from "@prisma/client";

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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-baseline gap-3 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Board</h1>
        <span className="font-handwritten text-xl text-violet">{posts.length} posts</span>
      </div>
      <PostFilters />
      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-handwritten text-2xl text-gray-400">Nothing here yet...</p>
          <p className="text-gray-500 mt-2">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
