import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { PostWithAuthor } from "@/types";

export function PostCard({ post }: { post: PostWithAuthor }) {
  return (
    <Link
      href={`/board/${post.id}`}
      className="block rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-2 mb-3">
        <Badge variant={post.type === "OFFER" ? "offer" : "request"}>
          {post.type}
        </Badge>
        <Badge>{post.category.replace("_", " ")}</Badge>
        {post.isRemote && <Badge variant="default">Remote</Badge>}
      </div>
      <h3 className="font-semibold text-gray-900 text-lg">{post.title}</h3>
      <p className="mt-2 text-sm text-gray-600 line-clamp-3">{post.description}</p>
      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="mt-4 flex items-center gap-2">
        <Avatar name={post.author.name} size="sm" src={post.author.profilePhoto} />
        <span className="text-sm text-gray-500">{post.author.name}</span>
        {post.location && (
          <span className="text-sm text-gray-400 ml-auto">{post.location}</span>
        )}
      </div>
    </Link>
  );
}
