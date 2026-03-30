import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { PostCard } from "@/components/posts/PostCard";
import Link from "next/link";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      posts: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, type: true, profilePhoto: true } },
        },
      },
    },
  });

  if (!user) notFound();

  const isOwnProfile = session?.user?.id === user.id;

  return (
    <div className="mx-auto max-w-3xl px-6 lg:px-8 pt-24 pb-16">
      <ProfileCard user={JSON.parse(JSON.stringify(user))} />

      {isOwnProfile && (
        <div className="mt-6">
          <Link href="/profile/edit" className="text-sm underline underline-offset-4 hover:no-underline">
            Edit Profile
          </Link>
        </div>
      )}

      {user.posts.length > 0 && (
        <div className="mt-12">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-6">Posts</p>
          <div className="border-t border-fg/10">
            {user.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
