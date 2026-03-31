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
    <div className="mx-auto max-w-3xl px-6 lg:px-8 pt-24 pb-16">
      <Link href="/board" className="text-xs text-muted hover:text-fg transition-colors font-mono uppercase tracking-wider">
        &larr; Board
      </Link>

      <div className="mt-8">
        <div className="flex items-baseline gap-4 mb-6">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
            {post.type}
          </span>
          <span className="font-mono text-[11px] text-muted">
            {post.category.replace("_", " ")}
          </span>
          {post.isRemote && (
            <span className="font-mono text-[11px] text-muted">Remote</span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-light leading-tight">{post.title}</h1>

        <p className="mt-8 text-fg/80 leading-relaxed whitespace-pre-wrap">{post.description}</p>

        {(post.availability || post.location) && (
          <div className="mt-8 flex gap-8 text-sm text-muted">
            {post.availability && (
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider block mb-1">Availability</span>
                <span className="text-fg">{post.availability}</span>
              </div>
            )}
            {post.location && (
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider block mb-1">Location</span>
                <span className="text-fg">{post.location}</span>
              </div>
            )}
          </div>
        )}

        {post.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            {post.tags.map((tag) => (
              <span key={tag} className="font-mono text-[11px] text-muted">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-fg/10 flex items-center justify-between">
          <Link href={`/profile/${post.author.id}`} className="hover:opacity-60 transition-opacity">
            <p className="text-sm">{post.author.name}</p>
            <p className="text-xs text-muted font-mono uppercase tracking-wider">{post.author.type}</p>
          </Link>

          {!isAuthor && session && (
            <InterestButton
              postId={post.id}
              existingStatus={existingConnection?.status || null}
            />
          )}
          {!session && (
            <Link href="/auth/signin" className="text-sm text-muted underline underline-offset-4 hover:no-underline">
              Sign in to connect
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
