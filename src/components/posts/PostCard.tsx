import Link from "next/link";
import { PostWithAuthor } from "@/types";

export function PostCard({ post }: { post: PostWithAuthor }) {
  return (
    <Link
      href={`/board/${post.id}`}
      className="group block py-6 border-b border-fg/10 hover:opacity-60 transition-opacity"
    >
      <div className="flex items-baseline gap-4 mb-2">
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
      <h3 className="text-lg font-light">{post.title}</h3>
      <p className="mt-2 text-sm text-muted line-clamp-2 leading-relaxed max-w-2xl">{post.description}</p>
      <div className="mt-3 flex items-center gap-3 text-xs text-muted">
        <span>{post.author.name}</span>
        {post.location && (
          <>
            <span>&middot;</span>
            <span>{post.location}</span>
          </>
        )}
      </div>
    </Link>
  );
}
