import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";

export default async function HomePage() {
  const featuredPosts = await prisma.post.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, type: true, profilePhoto: true } },
    },
  });

  return (
    <div>
      <section className="bg-indigo-600 text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Exchange services, build community
          </h1>
          <p className="mt-4 text-lg text-indigo-100 max-w-2xl mx-auto">
            A platform where individuals and collectives offer and request volunteer services for free.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/board"
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50"
            >
              Browse the Board
            </Link>
            <Link
              href="/auth/register"
              className="rounded-md bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400"
            >
              Join Now
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Posts</h2>
          {featuredPosts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No posts yet. Be the first to create one!</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/board/${post.id}`}
                  className="block rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant={post.type === "OFFER" ? "offer" : "request"}>
                      {post.type}
                    </Badge>
                    <Badge>{post.category.replace("_", " ")}</Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900">{post.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{post.description}</p>
                  <p className="mt-3 text-xs text-gray-400">by {post.author.name}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
