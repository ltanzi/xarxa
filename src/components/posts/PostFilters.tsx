"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/i18n/hook";

const CATEGORY_KEYS = ["", "LEGAL", "EDUCATION", "HEALTH", "TECHNOLOGY", "MANUAL_WORK", "TRANSLATION", "OTHER"] as const;
const TYPE_KEYS = ["", "OFFER", "REQUEST"] as const;

export function PostFilters({ basePath = "/board" }: { basePath?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const [tags, setTags] = useState<string[]>(() => {
    const s = searchParams.get("search");
    return s ? s.split(",").filter(Boolean) : [];
  });
  const [input, setInput] = useState("");
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

  function pushSearch(newTags: string[], currentInput: string) {
    const params = new URLSearchParams(searchParamsRef.current.toString());
    const allTerms = [...newTags, ...(currentInput.trim() ? [currentInput.trim()] : [])];
    if (allTerms.length > 0) {
      params.set("search", allTerms.join(","));
    } else {
      params.delete("search");
    }
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
              className="hover:opacity-60 transition-opacity leading-none"
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
            onClick={() => updateFilter("type", type.value)}
            className={`transition-colors ${
              (searchParams.get("type") || "") === type.value
                ? "text-fg underline underline-offset-4"
                : "text-fg/50 hover:text-fg"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex items-baseline gap-3 sm:gap-6 font-mono text-xs uppercase tracking-widest flex-wrap">
        <span className="text-fg shrink-0 font-medium">{t("posts.category")}</span>
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => updateFilter("category", cat.value)}
            className={`transition-colors ${
              (searchParams.get("category") || "") === cat.value
                ? "text-fg underline underline-offset-4"
                : "text-fg/50 hover:text-fg"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
