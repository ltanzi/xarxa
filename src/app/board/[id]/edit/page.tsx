import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PostForm } from "@/components/posts/PostForm";
import { getTranslations } from "@/i18n/server";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { id } = await params;
  const { t } = await getTranslations();

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) notFound();
  if (post.authorId !== session.user.id) redirect(`/board/${id}`);

  return (
    <div className="mx-auto max-w-2xl px-6 lg:px-8 pt-24 pb-16">
      <h1 className="text-3xl font-light mb-12">{t("posts.editPost")}</h1>
      <PostForm
        postId={post.id}
        initialData={{
          title: post.title,
          type: post.type,
          category: post.category,
          urgency: post.urgency,
          description: post.description,
          availability: post.availability,
          location: post.location,
          isRemote: post.isRemote,
          tags: post.tags,
        }}
      />
    </div>
  );
}
