import Link from "next/link";
import { PostWithAuthor } from "@/types";
import { formatDate } from "@/lib/date";
import { getTranslations } from "@/i18n/server";

export async function PostCard({ post }: { post: PostWithAuthor }) {
  const { t } = await getTranslations();

  return (
    <Link
      href={`/board/${post.id}`}
      className="group block py-6 border-b border-fg/10 hover:opacity-60 transition-opacity"
    >
      <div className="flex items-baseline gap-4 mb-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
          {t(`posts.${post.type.toLowerCase()}`)}
        </span>
        <span className="font-mono text-[11px] text-muted">
          {t(`categories.${post.category}`)}
        </span>
        {post.isRemote && (
          <span className="font-mono text-[11px] text-muted">{t("posts.remote")}</span>
        )}
        {post.closed && (
          <span className="font-mono text-[11px] uppercase tracking-wider text-accent">{t("posts.closed")}</span>
        )}
      </div>
      <h3 className={`text-lg font-light ${post.closed ? "text-muted" : ""}`}>{post.title}</h3>
      <p className="mt-2 text-sm text-muted line-clamp-2 leading-relaxed max-w-2xl">{post.description}</p>
      <div className="mt-3 flex items-center gap-3 text-xs text-muted">
        <span>{post.author.name}{post.author.type === "PRIVATE" && post.author.surname ? ` ${post.author.surname}` : ""}</span>
        {post.location && (
          <>
            <span>&middot;</span>
            <span>{post.location}</span>
          </>
        )}
        <span>&middot;</span>
        <span>{formatDate(post.createdAt)}</span>
      </div>
    </Link>
  );
}
