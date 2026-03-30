import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
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
      author: { select: { id: true, name: true, type: true, profilePhoto: true, location: true } },
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
    <div className="mx-auto max-w-3xl px-6 lg:px-10 pt-28 pb-20">
      <Link href="/board" className="font-label text-muted hover:text-fg transition-colors duration-300 inline-block mb-16">
        &larr; Board
      </Link>

      <div className="animate-in">
        <div className="flex gap-6 font-label text-muted mb-8">
          <span>{post.type}</span>
          <span>{post.category.replace("_", " ")}</span>
          {post.isRemote && <span>Remote</span>}
        </div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-300 leading-[1.05] tracking-tight">
          {post.title}
        </h1>

        <p className="mt-10 text-[15px] text-fg/75 leading-[1.8] whitespace-pre-wrap max-w-2xl">
          {post.description}
        </p>

        {(post.availability || post.location) && (
          <div className="mt-10 flex gap-16">
            {post.availability && (
              <div>
                <p className="font-label text-muted mb-2">Availability</p>
                <p className="text-sm">{post.availability}</p>
              </div>
            )}
            {post.location && (
              <div>
                <p className="font-label text-muted mb-2">Location</p>
                <p className="text-sm">{post.location}</p>
              </div>
            )}
          </div>
        )}

        {post.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-4">
            {post.tags.map((tag) => (
              <span key={tag} className="font-label text-muted">{tag}</span>
            ))}
          </div>
        )}

        <div className="mt-16 pt-10 border-t border-fg/8 flex items-end justify-between">
          <Link href={`/profile/${post.author.id}`} className="group">
            <p className="font-display text-xl font-400 group-hover:text-accent transition-colors duration-300">
              {post.author.name}
            </p>
            <p className="font-label text-muted mt-1">{post.author.type}</p>
          </Link>

          {!isAuthor && session && (
            <InterestButton
              postId={post.id}
              existingStatus={existingConnection?.status || null}
            />
          )}
          {!session && (
            <Link href="/auth/signin" className="font-label text-muted hover:text-accent transition-colors duration-300">
              Sign in to connect
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
