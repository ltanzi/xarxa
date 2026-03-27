import { PostForm } from "@/components/posts/PostForm";

export default function NewPostPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Post</h1>
      <div className="bg-white rounded-lg border shadow-sm p-8">
        <PostForm />
      </div>
    </div>
  );
}
