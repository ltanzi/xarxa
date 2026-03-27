"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/i18n/hook";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "LEGAL", label: "Legal" },
  { value: "EDUCATION", label: "Education" },
  { value: "HEALTH", label: "Health" },
  { value: "TECHNOLOGY", label: "Technology" },
  { value: "MANUAL_WORK", label: "Manual Work" },
  { value: "TRANSLATION", label: "Translation" },
  { value: "OTHER", label: "Other" },
];

const TYPES = [
  { value: "", label: "All types" },
  { value: "OFFER", label: "Offer" },
  { value: "REQUEST", label: "Request" },
];

export function PostFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/board?${params.toString()}`);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8">
      <div className="flex-1">
        <Input
          placeholder={t("common.search") + "..."}
          defaultValue={searchParams.get("search") || ""}
          onChange={(e) => {
            const value = e.target.value;
            const timeout = setTimeout(() => updateFilter("search", value), 300);
            return () => clearTimeout(timeout);
          }}
        />
      </div>
      <Select
        options={TYPES}
        value={searchParams.get("type") || ""}
        onChange={(e) => updateFilter("type", e.target.value)}
      />
      <Select
        options={CATEGORIES}
        value={searchParams.get("category") || ""}
        onChange={(e) => updateFilter("category", e.target.value)}
      />
      <Input
        placeholder={t("posts.location")}
        defaultValue={searchParams.get("location") || ""}
        onChange={(e) => {
          const value = e.target.value;
          const timeout = setTimeout(() => updateFilter("location", value), 300);
          return () => clearTimeout(timeout);
        }}
      />
    </div>
  );
}
