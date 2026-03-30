"use client";

import { useRouter, useSearchParams } from "next/navigation";

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "LEGAL", label: "Legal" },
  { value: "EDUCATION", label: "Education" },
  { value: "HEALTH", label: "Health" },
  { value: "TECHNOLOGY", label: "Technology" },
  { value: "MANUAL_WORK", label: "Manual work" },
  { value: "TRANSLATION", label: "Translation" },
  { value: "OTHER", label: "Other" },
];

const TYPES = [
  { value: "", label: "All" },
  { value: "OFFER", label: "Offers" },
  { value: "REQUEST", label: "Requests" },
];

export function PostFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/board?${params.toString()}`);
  }

  const activeType = searchParams.get("type") || "";
  const activeCat = searchParams.get("category") || "";

  return (
    <div className="mb-16 space-y-6">
      <div className="flex flex-wrap gap-x-1 items-center font-label">
        <span className="text-muted mr-3">Type</span>
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => updateFilter("type", t.value)}
            className={`px-3 py-1.5 transition-colors duration-200 ${
              activeType === t.value
                ? "text-fg bg-soft"
                : "text-muted hover:text-fg"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-1 items-center font-label">
        <span className="text-muted mr-3">Category</span>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => updateFilter("category", c.value)}
            className={`px-3 py-1.5 transition-colors duration-200 ${
              activeCat === c.value
                ? "text-fg bg-soft"
                : "text-muted hover:text-fg"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
