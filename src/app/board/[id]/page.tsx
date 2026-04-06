import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/date";
import { InterestButton } from "./InterestButton";
import { PostActions } from "./PostActions";
import { getTranslations } from "@/i18n/server";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const session = await auth();
  const { t } = await getTranslations();

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, surname: true, type: true, profilePhoto: true, location: true } },
      connections: {
        select: { id: true, requesterId: true, status: true, conversationId: true, requester: { select: { id: true, name: true, surname: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!post) notFound();

  const isAuthor = session?.user?.id === post.authorId;
  const existingConnection = session?.user?.id
    ? post.connections.find((c) => c.requesterId === session.user.id)
    : null;

  const authorDisplayName = post.author.type === "PRIVATE" && post.author.surname
    ? `${post.author.name} ${post.author.surname}`
    : post.author.name;

  return (
    <div className="mx-auto max-w-3xl px-6 lg:px-8 pt-24 pb-16">
      <Link href="/board" className="text-xs text-muted hover:text-fg transition-colors font-mono uppercase tracking-wider">
        &larr; {t("board.title")}
      </Link>

      <div className="mt-8">
        <div className="flex items-baseline gap-4 mb-6">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
            {t(`posts.${post.type.toLowerCase()}`)}
          </span>
          <span className="font-mono text-[11px] text-muted">
            {t(`categories.${post.category}`)}
          </span>
          {post.urgency !== "NORMAL" && (
            <span className={`font-mono text-[11px] uppercase tracking-wider ${post.urgency === "URGENT" ? "text-accent" : "text-muted"}`}>
              {t(`urgency.${post.urgency}`)}
            </span>
          )}
          {post.isRemote && (
            <span className="font-mono text-[11px] text-muted">{t("posts.remote")}</span>
          )}
          {post.closed && (
            <span className="font-mono text-[11px] uppercase tracking-wider text-accent">{t("posts.closed")}</span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-light leading-tight">{post.title}</h1>

        <p className="mt-8 text-fg/80 leading-relaxed whitespace-pre-wrap">{post.description}</p>

        {(post.availability || post.location) && (
          <div className="mt-8 flex gap-8 text-sm text-muted">
            {post.availability && (
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider block mb-1">{t("posts.availability")}</span>
                <span className="text-fg">{post.availability}</span>
              </div>
            )}
            {post.location && (
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider block mb-1">{t("posts.location")}</span>
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
            <p className="text-sm">{authorDisplayName}</p>
            <p className="text-xs text-muted font-mono uppercase tracking-wider">{post.author.type} &middot; {formatDate(post.createdAt)}</p>
          </Link>

          {isAuthor ? (
            <PostActions postId={post.id} closed={post.closed} />
          ) : (
            <>
              {!post.closed && session && (
                <InterestButton
                  postId={post.id}
                  existingStatus={existingConnection?.status || null}
                />
              )}
              {post.closed && session && !isAuthor && (
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{t("posts.closed")}</span>
              )}
              {!session && (
                <Link href="/auth/signin" className="text-sm text-muted underline underline-offset-4 hover:no-underline">
                  {t("posts.signInToConnect")}
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {isAuthor && post.connections.length > 0 && (
        <div className="mt-12 pt-8 border-t border-fg/10">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-4">
            {t("dashboard.connections")} ({post.connections.length})
          </p>
          <div className="divide-y divide-fg/10">
            {post.connections.map((conn) => (
              <div key={conn.id} className="flex items-center justify-between py-3">
                <Link href={`/profile/${conn.requester.id}`} className="text-sm hover:opacity-60 transition-opacity">
                  {conn.requester.name}{conn.requester.surname ? ` ${conn.requester.surname}` : ""}
                </Link>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                    {t(`dashboard.${conn.status.toLowerCase()}`)}
                  </span>
                  {conn.status === "ACCEPTED" && conn.conversationId && (
                    <Link href={`/chat/${conn.conversationId}`} className="text-xs underline underline-offset-4 hover:no-underline">
                      {t("nav.chat")}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
