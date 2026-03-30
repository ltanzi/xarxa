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
    <div className="mx-auto max-w-3xl px-6 lg:px-8 pt-20 pb-12">
      <Link href="/board" className="text-[10px] uppercase tracking-widest text-muted hover:text-fg transition-colors">
        &larr; Board
      </Link>

      <div className="mt-6">
        <div className="flex gap-4 text-[10px] uppercase tracking-widest text-muted mb-4">
          <span>{post.type}</span>
          <span>{post.category.replace("_", " ")}</span>
          {post.isRemote && <span>Remote</span>}
        </div>

        <h1 className="font-headline text-3xl sm:text-5xl">{post.title}</h1>

        <div className="mt-6 max-w-xl">
          <p className="text-muted leading-relaxed whitespace-pre-wrap">{post.description}</p>
        </div>

        {(post.availability || post.location) && (
          <div className="mt-6 flex gap-10 text-[10px] uppercase tracking-widest">
            {post.availability && (
              <div>
                <span className="text-muted block mb-1">Availability</span>
                <span className="text-fg normal-case tracking-normal text-[12px]">{post.availability}</span>
              </div>
            )}
            {post.location && (
              <div>
                <span className="text-muted block mb-1">Location</span>
                <span className="text-fg normal-case tracking-normal text-[12px]">{post.location}</span>
              </div>
            )}
          </div>
        )}

        {post.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-3 text-[10px] uppercase tracking-widest text-muted">
            {post.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-fg/10 flex items-center justify-between">
          <Link href={`/profile/${post.author.id}`} className="hover:opacity-50 transition-opacity">
            <p className="text-[12px]">{post.author.name}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted">{post.author.type}</p>
          </Link>

          {!isAuthor && session && (
            <InterestButton
              postId={post.id}
              existingStatus={existingConnection?.status || null}
            />
          )}
          {!session && (
            <Link href="/auth/signin" className="text-[11px] text-muted underline underline-offset-4 hover:no-underline">
              Sign in to connect
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
