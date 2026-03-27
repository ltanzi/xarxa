"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/hook";
import { postSchema } from "@/lib/validations";

const CATEGORIES = [
  { value: "LEGAL", label: "Legal" },
  { value: "EDUCATION", label: "Education" },
  { value: "HEALTH", label: "Health" },
  { value: "TECHNOLOGY", label: "Technology" },
  { value: "MANUAL_WORK", label: "Manual Work" },
  { value: "TRANSLATION", label: "Translation" },
  { value: "OTHER", label: "Other" },
];

const TYPES = [
  { value: "OFFER", label: "Offer" },
  { value: "REQUEST", label: "Request" },
];

export function PostForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: "",
    type: "OFFER",
    category: "OTHER",
    description: "",
    availability: "",
    location: "",
    isRemote: false,
    tags: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    };

    const parsed = postSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setServerError(data.error || "Failed to create post");
      setLoading(false);
      return;
    }

    const post = await res.json();
    router.push(`/board/${post.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{serverError}</div>
      )}

      <Input
        id="title"
        label={t("posts.title")}
        value={form.title}
        onChange={(e) => updateField("title", e.target.value)}
        error={errors.title}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          id="type"
          label={t("posts.type")}
          options={TYPES}
          value={form.type}
          onChange={(e) => updateField("type", e.target.value)}
        />
        <Select
          id="category"
          label={t("posts.category")}
          options={CATEGORIES}
          value={form.category}
          onChange={(e) => updateField("category", e.target.value)}
        />
      </div>

      <Textarea
        id="description"
        label={t("posts.description")}
        value={form.description}
        onChange={(e) => updateField("description", e.target.value)}
        error={errors.description}
        required
      />

      <Input
        id="availability"
        label={t("posts.availability")}
        value={form.availability}
        onChange={(e) => updateField("availability", e.target.value)}
        placeholder="e.g. Weekends, mornings..."
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="location"
          label={t("posts.location")}
          value={form.location}
          onChange={(e) => updateField("location", e.target.value)}
        />
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRemote}
              onChange={(e) => updateField("isRemote", e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm">{t("posts.remote")}</span>
          </label>
        </div>
      </div>

      <Input
        id="tags"
        label={t("posts.tags")}
        value={form.tags}
        onChange={(e) => updateField("tags", e.target.value)}
        placeholder={t("posts.tagsHelp")}
      />

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("common.loading") : t("posts.createPost")}
      </Button>
    </form>
  );
}
