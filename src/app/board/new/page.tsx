import { PostForm } from "@/components/posts/PostForm";

export default function NewPostPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 lg:px-8 pt-24 pb-16">
      <h1 className="text-3xl font-light mb-12">New post</h1>
      <PostForm />
    </div>
  );
}
