import { PostForm } from "@/components/posts/PostForm";
import { getTranslations } from "@/i18n/server";

export default async function NewPostPage() {
  const { t } = await getTranslations();

  return (
    <div className="mx-auto max-w-2xl px-6 lg:px-8 pt-24 pb-16">
      <h1 className="text-3xl font-light mb-12">{t("posts.newPost")}</h1>
      <PostForm />
    </div>
  );
}
