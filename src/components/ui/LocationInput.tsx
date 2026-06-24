"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Suggestion {
  name: string;
  country: string;
  state?: string;
}

interface LocationInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}

export function LocationInput({ label, value, onChange }: LocationInputProps) {
  const [input, setInput] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInput(value);
  }, [value]);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&layer=city&limit=6&lang=en`
      );
      const data = (await res.json()) as {
        features?: Array<{
          properties?: { name?: string; country?: string; state?: string };
        }>;
      };
      const results: Suggestion[] = (data.features || []).map((f) => ({
        name: f.properties?.name ?? "",
        country: f.properties?.country ?? "",
        state: f.properties?.state,
      }));
      // deduplicate by name+country
      const seen = new Set<string>();
      const unique = results.filter((r) => {
        const key = `${r.name}|${r.country}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setSuggestions(unique);
      setOpen(unique.length > 0);
      setActiveIndex(-1);
    } catch {
      setSuggestions([]);
      setOpen(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInput(val);
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  }

  function selectSuggestion(s: Suggestion) {
    const label = s.state ? `${s.name}, ${s.state}, ${s.country}` : `${s.name}, ${s.country}`;
    setInput(label);
    onChange(label);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
      } else {
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  // close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
          {label}
        </label>
      )}
      <input
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        autoComplete="off"
        className="block w-full border-b bg-transparent px-0 py-2 text-sm focus:outline-none transition-colors border-fg/15 focus:border-fg"
      />
      {open && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-bg border border-fg/15 text-sm shadow-sm max-h-52 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={() => selectSuggestion(s)}
              className={`px-3 py-2 cursor-pointer flex justify-between gap-4 ${
                i === activeIndex ? "bg-fg text-bg" : "hover:bg-fg/5"
              }`}
            >
              <span>{s.name}{s.state ? `, ${s.state}` : ""}</span>
              <span className="text-muted text-xs font-mono shrink-0">{s.country}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
