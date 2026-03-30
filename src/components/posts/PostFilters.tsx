"use client";

import { useRouter, useSearchParams } from "next/navigation";

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "LEGAL", label: "Legal" },
  { value: "EDUCATION", label: "Education" },
  { value: "HEALTH", label: "Health" },
  { value: "TECHNOLOGY", label: "Technology" },
  { value: "MANUAL_WORK", label: "Manual Work" },
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

  return (
    <div className="flex flex-wrap gap-x-8 gap-y-4 mb-12 font-mono text-[11px] uppercase tracking-widest">
      <div className="flex items-center gap-3">
        <span className="text-muted">Type</span>
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => updateFilter("type", t.value)}
            className={`transition-colors ${
              (searchParams.get("type") || "") === t.value
                ? "text-fg"
                : "text-muted hover:text-fg"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-muted">Category</span>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => updateFilter("category", c.value)}
            className={`transition-colors ${
              (searchParams.get("category") || "") === c.value
                ? "text-fg"
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
