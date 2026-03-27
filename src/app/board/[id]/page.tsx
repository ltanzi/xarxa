import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { InterestButton } from "./InterestButton";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const session = await auth();

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, type: true, profilePhoto: true, location: true, bio: true } },
      connections: {
        select: { id: true, requesterId: true, status: true },
      },
    },
  });

  if (!post) notFound();

  const isAuthor = session?.user?.id === post.authorId;
  const existingConnection = session?.user?.id
    ? post.connections.find((c) => c.requesterId === session.user.id)
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg border shadow-sm p-8">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant={post.type === "OFFER" ? "offer" : "request"}>
            {post.type}
          </Badge>
          <Badge>{post.category.replace("_", " ")}</Badge>
          {post.isRemote && <Badge>Remote</Badge>}
        </div>

        <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>

        <div className="mt-6 prose prose-sm max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap">{post.description}</p>
        </div>

        {post.availability && (
          <div className="mt-4">
            <span className="text-sm font-medium text-gray-500">Availability: </span>
            <span className="text-sm text-gray-700">{post.availability}</span>
          </div>
        )}

        {post.location && (
          <div className="mt-2">
            <span className="text-sm font-medium text-gray-500">Location: </span>
            <span className="text-sm text-gray-700">{post.location}</span>
          </div>
        )}

        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t flex items-center justify-between">
          <Link href={`/profile/${post.author.id}`} className="flex items-center gap-3 hover:opacity-80">
            <Avatar name={post.author.name} src={post.author.profilePhoto} />
            <div>
              <p className="text-sm font-medium text-gray-900">{post.author.name}</p>
              <p className="text-xs text-gray-500">{post.author.type}</p>
            </div>
          </Link>

          {!isAuthor && session && (
            <InterestButton
              postId={post.id}
              existingStatus={existingConnection?.status || null}
            />
          )}
          {!session && (
            <Link
              href="/auth/signin"
              className="text-sm text-indigo-600 hover:underline"
            >
              Sign in to express interest
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
