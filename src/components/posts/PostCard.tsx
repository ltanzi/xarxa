import Link from "next/link";
import { PostWithAuthor } from "@/types";

export function PostCard({ post }: { post: PostWithAuthor }) {
  return (
    <Link
      href={`/board/${post.id}`}
      className="group block py-3 border-b border-fg/8 hover:opacity-50 transition-opacity"
    >
      <div className="grid grid-cols-12 gap-3 items-baseline">
        <span className="col-span-2 lg:col-span-1 text-[10px] uppercase tracking-wider text-muted">
          {post.type}
        </span>
        <div className="col-span-10 sm:col-span-6 lg:col-span-7">
          <span className="font-headline text-lg">{post.title}</span>
          <p className="text-[11px] text-muted mt-0.5 line-clamp-1">{post.description}</p>
        </div>
        <span className="hidden sm:block col-span-2 text-[10px] uppercase tracking-wider text-muted text-right">
          {post.category.replace("_", " ")}
        </span>
        <span className="hidden lg:block col-span-2 text-[11px] text-muted text-right">
          {post.author.name}
        </span>
      </div>
    </Link>
  );
}
