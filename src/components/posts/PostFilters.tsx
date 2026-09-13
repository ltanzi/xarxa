"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/i18n/hook";
import { CATEGORY_KEYS, parseCategoryParam } from "@/lib/categories";

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
  // One row per filter, each opening its own list. Seventeen categories laid
  // out flat wrapped to four rows and buried the first post; as a row that
  // reads "Category — Moving, Gardening" it stays one line however long the
  // list grows. Only one row is open at a time.
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  // The whole filter block is shut on arrival so the board starts with posts,
  // not controls. It opens already expanded when the URL carries a filter —
  // someone landing on /board?category=MOVING arrived *because* of it.
  const [filtersOpen, setFiltersOpen] = useState(
    () => !!(searchParams.get("type") || searchParams.get("category")
      || searchParams.get("urgency") || searchParams.get("mode")),
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const searchParamsRef = useRef(searchParams);
  useEffect(() => { searchParamsRef.current = searchParams; }, [searchParams]);

  const selectedCategories: string[] = parseCategoryParam(searchParams.get("category"));

  const groups = [
    {
      key: "type",
      label: t("posts.type"),
      multi: false,
      options: TYPE_KEYS.map((value) => ({
        value: value as string,
        label: value === "" ? t("posts.all") : value === "OFFER" ? t("posts.offers") : t("posts.requests"),
      })),
    },
    {
      key: "category",
      label: t("posts.category"),
      multi: true,
      options: CATEGORY_KEYS.map((value) => ({
        value: value as string,
        label: t(`categories.${value}`),
      })),
    },
    {
      key: "urgency",
      label: t("posts.urgency"),
      multi: false,
      options: URGENCY_KEYS.map((value) => ({
        value: value as string,
        label: value === "" ? t("posts.all") : t(`urgency.${value}`),
      })),
    },
    {
      key: "mode",
      label: t("posts.mode"),
      multi: false,
      options: MODE_KEYS.map((value) => ({
        value: value as string,
        label: value === "" ? t("posts.all") : value === "REMOTE" ? t("posts.remote") : t("posts.inPerson"),
      })),
    },
  ];

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

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParamsRef.current.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    // Same reason as pushSearch: filters change the result set.
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  /** Categories are additive — a post matches if it carries any picked one. */
  function toggleCategory(value: string) {
    const next = selectedCategories.includes(value)
      ? selectedCategories.filter((c) => c !== value)
      : [...selectedCategories, value];
    setParam("category", next.join(","));
  }

  function summaryFor(group: (typeof groups)[number]) {
    if (group.multi) {
      if (selectedCategories.length === 0) return t("posts.all");
      return selectedCategories
        .map((c) => group.options.find((o) => o.value === c)?.label)
        .filter(Boolean)
        .join(", ");
    }
    const current = searchParams.get(group.key) || "";
    return group.options.find((o) => o.value === current)?.label ?? t("posts.all");
  }

  const anyActive =
    selectedCategories.length > 0 ||
    !!searchParams.get("type") ||
    !!searchParams.get("urgency") ||
    !!searchParams.get("mode");

  /**
   * What's switched on, for the collapsed header. Without this, a filtered
   * board would look identical to an unfiltered one once the panel is shut —
   * the user would be staring at a third of the board with no clue why.
   */
  const activeSummary = groups
    .filter((g) => (g.multi ? selectedCategories.length > 0 : !!searchParams.get(g.key)))
    .map((g) => summaryFor(g))
    .join(" · ");

  function clearAll() {
    const params = new URLSearchParams(searchParamsRef.current.toString());
    ["type", "category", "urgency", "mode", "page"].forEach((k) => params.delete(k));
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="mb-12 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
      {/* Two columns from `sm` up: search on the left, filters on the right.
          Each heading is its column's first child, so the two line up, and
          the filter rows open inside the right column instead of pushing the
          whole board down. */}
      <div className="flex min-w-0 flex-col gap-3">
        <p className="font-mono text-[11px] uppercase tracking-widest font-bold text-fg">
          {t("posts.search")}
        </p>

        {/* Search tag input — under its own heading, half the board wide. */}
        <div className="flex items-center gap-2 flex-wrap pb-2">
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
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <button
          type="button"
          aria-expanded={filtersOpen}
          aria-controls="board-filters"
          onClick={() => {
            // Collapsing also closes whichever list was open, so reopening
            // never restores a half-finished state.
            if (filtersOpen) setOpenGroup(null);
            setFiltersOpen((o) => !o);
          }}
          className="flex min-w-0 items-baseline gap-3 text-left font-mono text-[11px] uppercase tracking-widest hover:opacity-60 transition-opacity"
        >
          {/* Left-aligned in its column so it sits directly above the TYPE
              row. The +/− sits against the word rather than at the far edge —
              at the end of a wide button it read as decoration, not as the
              control that opens the panel. */}
          <span className="flex items-baseline gap-1.5 shrink-0">
            <span className="font-bold text-fg">{t("posts.filters")}</span>
            <span aria-hidden="true" className="text-fg/70 text-xs leading-none">
              {filtersOpen ? "−" : "+"}
            </span>
          </span>
          {!filtersOpen && anyActive && (
            <span className="min-w-0 truncate normal-case tracking-normal text-fg/60">
              {activeSummary}
            </span>
          )}
        </button>

      <div id="board-filters" className={`${filtersOpen ? "block" : "hidden"} font-mono text-xs`}>
        {groups.map((group) => {
          const isOpen = openGroup === group.key;
          const panelId = `filter-panel-${group.key}`;
          const active = group.multi
            ? selectedCategories.length > 0
            : !!searchParams.get(group.key);

          return (
            <div key={group.key}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenGroup(isOpen ? null : group.key)}
                className="w-full flex items-baseline gap-4 py-2.5 text-left transition-colors hover:text-fg"
              >
                <span className="uppercase tracking-widest text-fg/50 w-20 sm:w-24 shrink-0">
                  {group.label}
                </span>
                <span className={`flex-1 truncate ${active ? "text-fg" : "text-fg/40"}`}>
                  {summaryFor(group)}
                </span>
                <span aria-hidden="true" className="text-fg/40 shrink-0">
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {/* Always in the DOM so aria-controls points at something real. */}
              <div
                id={panelId}
                className={`${isOpen ? "flex" : "hidden"} flex-wrap gap-x-5 gap-y-2 pb-3`}
              >
                {group.multi && (
                  <button
                    type="button"
                    aria-pressed={selectedCategories.length === 0}
                    onClick={() => setParam("category", "")}
                    className={`py-1 -my-1 transition-colors ${
                      selectedCategories.length === 0
                        ? "text-fg underline underline-offset-4"
                        : "text-fg/50 hover:text-fg"
                    }`}
                  >
                    {t("posts.all")}
                  </button>
                )}
                {group.options.map((option) => {
                  const picked = group.multi
                    ? selectedCategories.includes(option.value)
                    : (searchParams.get(group.key) || "") === option.value;
                  return (
                    <button
                      key={option.value || "all"}
                      type="button"
                      aria-pressed={picked}
                      onClick={() => {
                        if (group.multi) {
                          // Stay open: picking several is the whole point.
                          toggleCategory(option.value);
                        } else {
                          setParam(group.key, option.value);
                          setOpenGroup(null);
                        }
                      }}
                      className={`py-1 -my-1 transition-colors ${
                        picked
                          ? "text-fg underline underline-offset-4"
                          : "text-fg/50 hover:text-fg"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {anyActive && (
        <button
          type="button"
          onClick={clearAll}
          className="self-start font-mono text-xs uppercase tracking-widest text-fg/50 hover:text-fg transition-colors py-1"
        >
          {t("board.clearFilters")}
        </button>
      )}
      </div>
    </div>
  );
}
