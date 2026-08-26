"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/i18n/hook";

const CATEGORY_KEYS = ["", "LEGAL", "EDUCATION", "HEALTH", "TECHNOLOGY", "MANUAL_WORK", "TRANSLATION", "OTHER"] as const;
const TYPE_KEYS = ["", "OFFER", "REQUEST"] as const;
const URGENCY_KEYS = ["", "LOW", "NORMAL", "URGENT"] as const;
const MODE_KEYS = ["", "REMOTE", "IN_PERSON"] as const;

export function PostFilters({ basePath = "/board" }: { basePath?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const [tags, setTags] = useState<string[]>(() => {
    const s = searchParams.get("search");
    return s ? s.split(",").filter(Boolean) : [];
  });
  const [input, setInput] = useState("");
  // Mobile: Category/Urgency/Mode collapse behind one "FILTERS +" line —
  // ~18 tiny buttons across 6 wrapped rows pushed the first post far
  // below the fold. Desktop always shows everything.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const searchParamsRef = useRef(searchParams);
  useEffect(() => { searchParamsRef.current = searchParams; }, [searchParams]);

  const types = TYPE_KEYS.map((value) => ({
    value,
    label: value === "" ? t("posts.all") : value === "OFFER" ? t("posts.offers") : t("posts.requests"),
  }));

  const categories = CATEGORY_KEYS.map((value) => ({
    value,
    label: value === "" ? t("posts.all") : t(`categories.${value}`),
  }));

  const urgencies = URGENCY_KEYS.map((value) => ({
    value,
    label: value === "" ? t("posts.all") : t(`urgency.${value}`),
  }));

  const modes = MODE_KEYS.map((value) => ({
    value,
    label: value === "" ? t("posts.all") : value === "REMOTE" ? t("posts.remote") : t("posts.inPerson"),
  }));

  function pushSearch(newTags: string[], currentInput: string) {
    const params = new URLSearchParams(searchParamsRef.current.toString());
    const allTerms = [...newTags, ...(currentInput.trim() ? [currentInput.trim()] : [])];
    if (allTerms.length > 0) {
      params.set("search", allTerms.join(","));
    } else {
      params.delete("search");
    }
    // A new search means a new result set — a stale ?page=3 from the old
    // one would show "no results" even when matches exist.
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  // Real-time debounced search as user types
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushSearch(tags, input), 300);
    return () => clearTimeout(debounceRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      const word = input.trim();
      if (!tags.includes(word)) {
        const newTags = [...tags, word];
        setTags(newTags);
        setInput("");
        clearTimeout(debounceRef.current);
        pushSearch(newTags, "");
      } else {
        setInput("");
      }
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      const newTags = tags.slice(0, -1);
      setTags(newTags);
      clearTimeout(debounceRef.current);
      pushSearch(newTags, "");
    }
  }

  function removeTag(tag: string) {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    clearTimeout(debounceRef.current);
    pushSearch(newTags, input);
  }

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParamsRef.current.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    // Same reason as pushSearch: filters change the result set.
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 mb-12">
      {/* Search tag input */}
      <div className="flex items-center gap-2 flex-wrap border-b border-fg/20 pb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 bg-fg text-bg text-xs font-mono px-3 py-1 rounded-full"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              aria-label={`${t("posts.removeTerm")}: ${tag}`}
              className="hover:opacity-60 transition-opacity leading-none p-1 -m-1"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label={t("posts.searchLabel")}
          placeholder={tags.length === 0 ? t("posts.searchPlaceholder") : ""}
          className="flex-1 min-w-[120px] bg-transparent text-sm placeholder:text-fg/30 focus:outline-none py-1"
        />
      </div>

      {/* Type filter */}
      <div className="flex items-baseline gap-3 sm:gap-6 font-mono text-xs uppercase tracking-widest flex-wrap">
        <span className="text-fg shrink-0 font-medium">{t("posts.type")}</span>
        {types.map((type) => (
          <button
            key={type.value}
            aria-pressed={(searchParams.get("type") || "") === type.value}
            onClick={() => updateFilter("type", type.value)}
            className={`transition-colors py-1 -my-1 ${
              (searchParams.get("type") || "") === type.value
                ? "text-fg underline underline-offset-4"
                : "text-fg/50 hover:text-fg"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Mobile-only disclosure for the remaining filter rows */}
      <button
        type="button"
        onClick={() => setFiltersOpen((o) => !o)}
        aria-expanded={filtersOpen}
        className="sm:hidden self-start font-mono text-xs uppercase tracking-widest text-fg/70 hover:text-fg transition-colors py-1"
      >
        {t("posts.filtersToggle")} {filtersOpen ? "−" : "+"}
      </button>

      <div className={`${filtersOpen ? "flex" : "hidden"} sm:flex flex-col gap-3`}>
      {/* Category filter */}
      <div className="flex items-baseline gap-3 sm:gap-6 font-mono text-xs uppercase tracking-widest flex-wrap">
        <span className="text-fg shrink-0 font-medium">{t("posts.category")}</span>
        {categories.map((cat) => (
          <button
            key={cat.value}
            aria-pressed={(searchParams.get("category") || "") === cat.value}
            onClick={() => updateFilter("category", cat.value)}
            className={`transition-colors py-1 -my-1 ${
              (searchParams.get("category") || "") === cat.value
                ? "text-fg underline underline-offset-4"
                : "text-fg/50 hover:text-fg"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Urgency filter */}
      <div className="flex items-baseline gap-3 sm:gap-6 font-mono text-xs uppercase tracking-widest flex-wrap">
        <span className="text-fg shrink-0 font-medium">{t("posts.urgency")}</span>
        {urgencies.map((urg) => (
          <button
            key={urg.value}
            aria-pressed={(searchParams.get("urgency") || "") === urg.value}
            onClick={() => updateFilter("urgency", urg.value)}
            className={`transition-colors py-1 -my-1 ${
              (searchParams.get("urgency") || "") === urg.value
                ? "text-fg underline underline-offset-4"
                : "text-fg/50 hover:text-fg"
            }`}
          >
            {urg.label}
          </button>
        ))}
      </div>

      {/* Mode filter */}
      <div className="flex items-baseline gap-3 sm:gap-6 font-mono text-xs uppercase tracking-widest flex-wrap">
        <span className="text-fg shrink-0 font-medium">{t("posts.mode")}</span>
        {modes.map((m) => (
          <button
            key={m.value}
            aria-pressed={(searchParams.get("mode") || "") === m.value}
            onClick={() => updateFilter("mode", m.value)}
            className={`transition-colors py-1 -my-1 ${
              (searchParams.get("mode") || "") === m.value
                ? "text-fg underline underline-offset-4"
                : "text-fg/50 hover:text-fg"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      </div>
    </div>
  );
}
