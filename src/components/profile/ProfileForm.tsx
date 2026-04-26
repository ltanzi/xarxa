"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { LocationInput } from "@/components/ui/LocationInput";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useTranslation } from "@/i18n/hook";
import { LanguageTagInput } from "@/components/ui/LanguageTagInput";

const PREF_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "ca", label: "Català" },
];

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    surname?: string | null;
    type: string;
    location?: string | null;
    bio?: string | null;
    skills?: string[];
    profilePhoto?: string | null;
    preferredLanguage?: string | null;
    languages?: string[];
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: user.name,
    surname: user.surname || "",
    type: user.type as "PRIVATE" | "COLLECTIVE",
    location: user.location || "",
    bio: user.bio || "",
    preferredLanguage: (user.preferredLanguage || "en") as "en" | "es" | "ca",
  });
  const [skills, setSkills] = useState<string[]>(user.skills || []);
  const [skillInput, setSkillInput] = useState("");
  const [languages, setLanguages] = useState<string[]>(user.languages || []);
  const [photo, setPhoto] = useState(user.profilePhoto);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSkillKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = skillInput.trim();
      if (val && !skills.includes(val)) setSkills((prev) => [...prev, val]);
      setSkillInput("");
    }
    if (e.key === "Backspace" && !skillInput && skills.length > 0) {
      setSkills((prev) => prev.slice(0, -1));
    }
  }

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
      body: JSON.stringify({ ...form, skills, languages }),
    });

    if (res.ok) {
      window.location.href = `/profile/${user.id}`;
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
        <div className="flex flex-col gap-1">
          <label className="cursor-pointer text-sm text-muted hover:text-fg transition-colors underline underline-offset-4 hover:no-underline">
            {t("profile.uploadPhoto")}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </label>
          {photo && (
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/profile", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...form, skills, languages, profilePhoto: null }),
                });
                setPhoto(null);
              }}
              className="text-sm text-muted hover:text-fg transition-colors underline underline-offset-4 hover:no-underline text-left"
            >
              {t("profile.removePhoto")}
            </button>
          )}
        </div>
      </div>

      <Input
        id="name"
        label={t("auth.name")}
        value={form.name}
        onChange={(e) => updateField("name", e.target.value)}
        required
      />

      {form.type === "PRIVATE" && (
        <Input
          id="surname"
          label={t("profile.surname")}
          value={form.surname}
          onChange={(e) => updateField("surname", e.target.value)}
          required
        />
      )}

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
          {PREF_LANGUAGES.map((lang) => (
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

      <LanguageTagInput
        label={t("profile.languages")}
        placeholder={t("profile.addLanguage")}
        value={languages}
        onChange={setLanguages}
      />

      <LocationInput
        label={t("profile.location")}
        value={form.location}
        onChange={(val) => updateField("location", val)}
      />

      <Textarea
        id="bio"
        label={t("profile.bio")}
        value={form.bio}
        onChange={(e) => updateField("bio", e.target.value)}
      />

      {form.type === "PRIVATE" && (
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted mb-2">{t("profile.skills")}</p>
          <div className="flex items-center gap-2 flex-wrap border-b border-fg/20 pb-2">
            {skills.map((skill) => (
              <span key={skill} className="inline-flex items-center gap-1.5 bg-fg text-bg text-xs font-mono px-3 py-1 rounded-full">
                {skill}
                <button type="button" onClick={() => setSkills((prev) => prev.filter((s) => s !== skill))} className="hover:opacity-60 transition-opacity">×</button>
              </span>
            ))}
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder={skills.length === 0 ? t("profile.addSkill") : ""}
              className="flex-1 min-w-[120px] bg-transparent text-sm placeholder:text-fg/30 focus:outline-none py-1"
            />
          </div>
        </div>
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
