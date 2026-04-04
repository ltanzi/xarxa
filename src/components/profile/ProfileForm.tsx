"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useTranslation } from "@/i18n/hook";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "ca", label: "Català" },
];

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    type: string;
    location?: string | null;
    bio?: string | null;
    skills?: string | null;
    mission?: string | null;
    profilePhoto?: string | null;
    preferredLanguage?: string | null;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: user.name,
    type: user.type as "PRIVATE" | "COLLECTIVE",
    location: user.location || "",
    bio: user.bio || "",
    skills: user.skills || "",
    mission: user.mission || "",
    preferredLanguage: (user.preferredLanguage || "en") as "en" | "es" | "ca",
  });
  const [photo, setPhoto] = useState(user.profilePhoto);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      setPhoto(data.profilePhoto);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push(`/profile/${user.id}`);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || t("common.error"));
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <div className="flex items-center gap-4">
        <Avatar name={form.name} src={photo} size="lg" />
        <div>
          <label className="cursor-pointer text-sm text-muted hover:text-fg transition-colors underline underline-offset-4 hover:no-underline">
            {t("profile.uploadPhoto")}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </label>
        </div>
      </div>

      <Input
        id="name"
        label={t("auth.name")}
        value={form.name}
        onChange={(e) => updateField("name", e.target.value)}
        required
      />

      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-muted mb-3">{t("auth.type")}</p>
        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="PRIVATE"
              checked={form.type === "PRIVATE"}
              onChange={(e) => updateField("type", e.target.value)}
              className="accent-fg"
            />
            {t("auth.individual")}
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="COLLECTIVE"
              checked={form.type === "COLLECTIVE"}
              onChange={(e) => updateField("type", e.target.value)}
              className="accent-fg"
            />
            {t("auth.collective")}
          </label>
        </div>
      </div>

      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-muted mb-3">{t("profile.preferredLanguage")}</p>
        <div className="flex gap-6 text-sm">
          {LANGUAGES.map((lang) => (
            <label key={lang.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="preferredLanguage"
                value={lang.value}
                checked={form.preferredLanguage === lang.value}
                onChange={(e) => updateField("preferredLanguage", e.target.value)}
                className="accent-fg"
              />
              {lang.label}
            </label>
          ))}
        </div>
      </div>

      <Input
        id="location"
        label={t("profile.location")}
        value={form.location}
        onChange={(e) => updateField("location", e.target.value)}
      />

      <Textarea
        id="bio"
        label={t("profile.bio")}
        value={form.bio}
        onChange={(e) => updateField("bio", e.target.value)}
      />

      {form.type === "PRIVATE" && (
        <Textarea
          id="skills"
          label={t("profile.skills")}
          value={form.skills}
          onChange={(e) => updateField("skills", e.target.value)}
        />
      )}

      {form.type === "COLLECTIVE" && (
        <Textarea
          id="mission"
          label={t("profile.mission")}
          value={form.mission}
          onChange={(e) => updateField("mission", e.target.value)}
        />
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? t("common.loading") : t("common.save")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
