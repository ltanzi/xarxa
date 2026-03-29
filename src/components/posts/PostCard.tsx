import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { PostWithAuthor } from "@/types";

const categoryColors: Record<string, string> = {
  LEGAL: "category-legal",
  EDUCATION: "category-education",
  HEALTH: "category-health",
  TECHNOLOGY: "category-technology",
  MANUAL_WORK: "category-manual_work",
  TRANSLATION: "category-translation",
  OTHER: "category-other",
};

const categoryBadgeColors: Record<string, "violet" | "sky" | "coral" | "lime" | "peach" | "sunflower" | "blush"> = {
  LEGAL: "violet",
  EDUCATION: "sky",
  HEALTH: "coral",
  TECHNOLOGY: "lime",
  MANUAL_WORK: "peach",
  TRANSLATION: "sunflower",
  OTHER: "blush",
};

export function PostCard({ post }: { post: PostWithAuthor }) {
  return (
    <Link
      href={`/board/${post.id}`}
      className={`card-playful block rounded-2xl bg-white/80 p-6 shadow-sm border-2 border-gray-100 hover:border-gray-200 hover:shadow-md ${categoryColors[post.category] || ""}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Badge variant={post.type === "OFFER" ? "offer" : "request"}>
          {post.type === "OFFER" ? "Offer" : "Request"}
        </Badge>
        <Badge color={categoryBadgeColors[post.category]}>
          {post.category.replace("_", " ")}
        </Badge>
        {post.isRemote && <Badge color="mint">Remote</Badge>}
      </div>
      <h3 className="font-bold text-gray-900 text-lg">{post.title}</h3>
      <p className="mt-2 text-sm text-gray-500 line-clamp-3 leading-relaxed">{post.description}</p>
      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs text-violet bg-violet/10 px-2 py-0.5 rounded-full font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="mt-4 pt-3 border-t border-dashed border-gray-200 flex items-center gap-2">
        <Avatar name={post.author.name} size="sm" src={post.author.profilePhoto} />
        <span className="text-sm text-gray-600 font-medium">{post.author.name}</span>
        {post.location && (
          <span className="text-xs text-gray-400 ml-auto font-handwritten text-base">{post.location}</span>
        )}
      </div>
    </Link>
  );
}
