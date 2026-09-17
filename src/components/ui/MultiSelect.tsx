"use client";

import { useState, useRef, useEffect, useId } from "react";

interface MultiSelectProps {
  id?: string;
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  /** Once this many are picked, the rest go inert rather than silently failing. */
  max?: number;
  /** Rendered under the field; use it to explain the cap before they hit it. */
  hint?: string;
}

/**
 * Sibling of <Select> for fields that take several values. Same visual
 * language (bottom rule, mono label, popup list) and the same close-on-blur
 * and close-on-outside-click behaviour, with one deliberate difference:
 * choosing an option does NOT close the list, because the whole point is
 * picking more than one. It also opens at the top rather than at the
 * current value, since there may be several.
 */
export function MultiSelect({
  id,
  label,
  error,
  options,
  value,
  onChange,
  placeholder,
  max,
  hint,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const listboxId = useId();

  const atMax = max !== undefined && value.length >= max;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && activeIndex >= 0) {
      itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, open]);

  useEffect(() => {
    itemRefs.current.length = options.length;
  }, [options.length]);

  function toggle(val: string) {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
      return;
    }
    if (atMax) return;
    onChange([...value, val]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
        setActiveIndex(0);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (activeIndex >= 0) toggle(options[activeIndex].value);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  // Fall back to the raw key rather than dropping it: a value with no matching
  // option would otherwise disappear from the label while staying in state and
  // being submitted. A visible wrong value beats an invisible one.
  const summary = value
    .map((v) => options.find((o) => o.value === v)?.label ?? v)
    .join(", ");

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
          {label}
        </label>
      )}
      <button
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={open && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
        onClick={() => {
          setOpen((o) => !o);
          setActiveIndex(open ? -1 : 0);
        }}
        // Tabbing away used to leave the popup open — the same bug Select
        // fixed. Safe here because the options preventDefault on mousedown,
        // so clicking one never blurs the button in the first place.
        onBlur={() => { setOpen(false); setActiveIndex(-1); }}
        onKeyDown={handleKeyDown}
        className={`block w-full truncate border-b bg-transparent px-0 py-2 text-sm text-left focus:outline-none transition-colors focus-visible:ring-1 focus-visible:ring-fg/40 ${
          error ? "border-accent" : "border-fg/15 focus:border-fg"
        } ${summary ? "" : "text-fg/30"}`}
      >
        {summary || placeholder}
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-50 left-0 right-0 top-full mt-1 bg-bg border border-fg/15 text-sm shadow-sm max-h-60 overflow-y-auto"
        >
          {options.map((opt, i) => {
            const selected = value.includes(opt.value);
            // aria-disabled rather than dropping the option: it stays in the
            // listbox's option set, so the "n of 17" position and count a
            // screen reader announces stay correct while selection is blocked.
            const blocked = atMax && !selected;
            return (
              <li
                key={opt.value}
                id={`${listboxId}-opt-${i}`}
                ref={(el) => { itemRefs.current[i] = el; }}
                role="option"
                aria-selected={selected}
                aria-disabled={blocked || undefined}
                onMouseDown={(e) => { e.preventDefault(); toggle(opt.value); }}
                className={`flex items-center gap-2 px-3 py-2 ${
                  blocked ? "cursor-default text-fg/25" : "cursor-pointer"
                } ${i === activeIndex ? "bg-fg text-bg" : selected ? "text-fg" : blocked ? "" : "hover:bg-fg/5"}`}
              >
                <span aria-hidden="true" className="font-mono text-[11px] w-3 shrink-0">
                  {selected ? "×" : ""}
                </span>
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}

      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-accent">{error}</p>}
    </div>
  );
}
