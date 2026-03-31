import Link from "next/link";
import { PostWithAuthor } from "@/types";

const spotClass: Record<string, string> = {
  LEGAL: "spot-legal",
  EDUCATION: "spot-education",
  HEALTH: "spot-health",
  TECHNOLOGY: "spot-technology",
  MANUAL_WORK: "spot-manual_work",
  TRANSLATION: "spot-translation",
  OTHER: "spot-other",
};

export function PostCard({ post }: { post: PostWithAuthor }) {
  return (
    <Link
      href={`/board/${post.id}`}
      className="group block py-5 border-b border-fg/10 hover:opacity-60 transition-opacity"
    >
      <div className="flex items-baseline gap-4 mb-1">
        <span className={`text-[11px] uppercase tracking-wider font-bold ${spotClass[post.category] || "text-muted"}`}>
          {post.type}
        </span>
        <span className={`text-[11px] uppercase tracking-wider ${spotClass[post.category] || "text-muted"}`}>
          {post.category.replace("_", " ")}
        </span>
        {post.isRemote && (
          <span className="text-[11px] text-muted uppercase tracking-wider">Remote</span>
        )}
      </div>
      <h3 className="font-display text-xl normal-case tracking-normal">{post.title}</h3>
      <p className="mt-1.5 text-sm text-muted line-clamp-2 leading-relaxed max-w-2xl">{post.description}</p>
      <div className="mt-2 flex items-center gap-3 text-xs text-muted">
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
