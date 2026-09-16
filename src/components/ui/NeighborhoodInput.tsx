"use client";

import { useState, useEffect, useRef, useId } from "react";
import { BARCELONA_BARRIS } from "@/lib/barcelona";

interface NeighborhoodInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

/** Ignore accents and case so "gracia" finds "la Vila de Gràcia". */
function fold(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Type-to-filter picker over Barcelona's 73 barris.
 *
 * A plain <Select> would have meant scrolling a 73-item list; the local
 * list is small enough that filtering needs no network, unlike the city
 * field next to it. The committed value is always either "" or an exact
 * barri name — typing alone never sets it — so whatever reaches the server
 * is already one of the known values.
 */
export function NeighborhoodInput({ label, placeholder, value, onChange }: NeighborhoodInputProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const inputId = useId();
  const listboxId = useId();

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
        // Half-typed text is not a choice — snap back to the committed
        // value so the field never shows something that wasn't saved.
        setQuery(value);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [value]);

  const matches =
    query.trim() === "" || query === value
      ? BARCELONA_BARRIS
      : BARCELONA_BARRIS.filter(
          (b) => fold(b.name).includes(fold(query)) || fold(b.district).includes(fold(query)),
        );

  useEffect(() => {
    if (open && activeIndex >= 0) itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function commit(name: string) {
    onChange(name);
    setQuery(name);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActiveIndex(0); }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && matches[activeIndex]) commit(matches[activeIndex].name);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      setQuery(value);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2 border-b border-fg/15 focus-within:border-fg transition-colors">
        <input
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={open && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
            // Editing invalidates the previous pick until a new one is made,
            // so a stale barri can't be saved alongside unrelated text.
            if (value) onChange("");
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 bg-transparent px-0 py-2 text-sm placeholder:text-fg/30 focus:outline-none"
        />
        {value && (
          <button
            type="button"
            onClick={() => commit("")}
            aria-label={`${label ?? ""} ×`.trim()}
            className="shrink-0 text-muted hover:text-fg transition-colors p-1 -m-1 text-sm"
          >
            ×
          </button>
        )}
      </div>

      {open && matches.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 left-0 right-0 top-full mt-1 bg-bg border border-fg/15 text-sm shadow-sm max-h-60 overflow-y-auto"
        >
          {matches.map((b, i) => (
            <li
              key={b.name}
              id={`${listboxId}-opt-${i}`}
              ref={(el) => { itemRefs.current[i] = el; }}
              role="option"
              aria-selected={b.name === value}
              onMouseDown={(e) => { e.preventDefault(); commit(b.name); }}
              className={`px-3 py-2 cursor-pointer flex justify-between gap-4 ${
                i === activeIndex ? "bg-fg text-bg" : "hover:bg-fg/5"
              }`}
            >
              <span className="min-w-0 truncate">{b.name}</span>
              {/* The district disambiguates barris nobody can place by name. */}
              <span className={`text-xs font-mono shrink-0 ${i === activeIndex ? "text-bg/70" : "text-muted"}`}>
                {b.district}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
