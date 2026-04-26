"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { LocationInput } from "@/components/ui/LocationInput";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/hook";
import { postSchema } from "@/lib/validations";

const CATEGORY_KEYS = ["LEGAL", "EDUCATION", "HEALTH", "TECHNOLOGY", "MANUAL_WORK", "TRANSLATION", "OTHER"] as const;
const TYPE_KEYS = ["OFFER", "REQUEST"] as const;
const URGENCY_KEYS = ["LOW", "NORMAL", "URGENT"] as const;

interface PostFormData {
  title: string;
  type: string;
  category: string;
  description: string;
  urgency?: string | null;
  availability?: string | null;
  location?: string | null;
  isRemote: boolean;
  tags: string[];
}

type PostFormProps =
  | { postId?: undefined; initialData?: undefined }
  | { postId: string; initialData: PostFormData };

export function PostForm({ postId, initialData }: PostFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const isEditing = !!postId;

  const categories = CATEGORY_KEYS.map((value) => ({ value, label: t(`categories.${value}`) }));
  const types = TYPE_KEYS.map((value) => ({
    value,
    label: value === "OFFER" ? t("posts.offer") : t("posts.request"),
  }));
  const urgencies = URGENCY_KEYS.map((value) => ({ value, label: t(`urgency.${value}`) }));

  const initialType = initialData?.type || (searchParams.get("type") === "REQUEST" ? "REQUEST" : "OFFER");
  const [form, setForm] = useState({
    title: initialData?.title || "",
    type: initialType,
    category: initialData?.category || "OTHER",
    urgency: initialData?.urgency || "NORMAL",
    description: initialData?.description || "",
    availability: initialData?.availability || "",
    location: initialData?.location || "",
    isRemote: initialData?.isRemote || false,
    tags: initialData?.tags?.join(", ") || "",
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
      tags: form.tags ? form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
    };

    const parsed = postSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    const url = isEditing ? `/api/posts/${postId}` : "/api/posts";
    const method = isEditing ? "PATCH" : "POST";

    let navigated = false;
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch((parseErr) => {
          console.error("[PostForm] non-JSON error body", { status: res.status, parseErr });
          return {};
        });
        setServerError(data.error || t(isEditing ? "posts.failedToUpdate" : "posts.failedToCreate"));
        return;
      }

      const post = await res.json();
      navigated = true;
      router.push(`/board/${post.id || postId}`);
      router.refresh();
    } catch (err) {
      console.error("[PostForm submit]", err);
      setServerError(t(isEditing ? "posts.failedToUpdate" : "posts.failedToCreate"));
    } finally {
      if (!navigated) setLoading(false);
    }
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          id="type"
          label={t("posts.type")}
          options={types}
          value={form.type}
          onChange={(e) => updateField("type", e.target.value)}
        />
        <Select
          id="category"
          label={t("posts.category")}
          options={categories}
          value={form.category}
          onChange={(e) => updateField("category", e.target.value)}
        />
        <Select
          id="urgency"
          label={t("posts.urgency")}
          options={urgencies}
          value={form.urgency}
          onChange={(e) => updateField("urgency", e.target.value)}
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
        label={t("posts.availabilityOptional")}
        value={form.availability}
        onChange={(e) => updateField("availability", e.target.value)}
        placeholder={t("posts.availabilityPlaceholder")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <LocationInput
          label={t("posts.locationOptional")}
          value={form.location}
          onChange={(val) => updateField("location", val)}
        />
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRemote}
              onChange={(e) => updateField("isRemote", e.target.checked)}
              className="accent-fg"
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
        {loading ? t("common.loading") : t(isEditing ? "posts.updatePost" : "posts.createPost")}
      </Button>
    </form>
  );
}
