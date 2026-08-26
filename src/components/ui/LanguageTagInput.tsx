"use client";

import { useState, useRef, useEffect, useId } from "react";
import { LANGUAGES } from "@/lib/languages";

interface LanguageTagInputProps {
  label?: string;
  placeholder?: string;
  value: string[];
  onChange: (langs: string[]) => void;
}

export function LanguageTagInput({ label, placeholder, value, onChange }: LanguageTagInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => {
    if (input.length === 0) {
      setSuggestions([]);
      return;
    }
    const q = input.toLowerCase();
    const matches = LANGUAGES.filter(
      (l) => l.toLowerCase().startsWith(q) && !value.includes(l)
    ).slice(0, 6);
    setSuggestions(matches);
    setActiveIndex(-1);
  }, [input, value]);

  function addTag(lang: string) {
    if (lang && !value.includes(lang)) {
      onChange([...value, lang]);
    }
    setInput("");
    setSuggestions([]);
    setActiveIndex(-1);
  }

  function removeTag(lang: string) {
    onChange(value.filter((l) => l !== lang));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const pick = activeIndex >= 0 ? suggestions[activeIndex] : suggestions[0];
        addTag(pick);
        return;
      }
      if (e.key === "Escape") {
        setSuggestions([]);
        setActiveIndex(-1);
        return;
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (input.trim()) addTag(input.trim());
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  // close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">{label}</label>
      )}
      <div className="flex items-center gap-2 flex-wrap border-b border-fg/20 pb-2">
        {value.map((lang) => (
          <span
            key={lang}
            className="inline-flex items-center gap-1.5 bg-fg text-bg text-xs font-mono px-3 py-1 rounded-full"
          >
            {lang}
            <button
              type="button"
              onClick={() => removeTag(lang)}
              aria-label={`${lang} ×`}
              className="hover:opacity-60 transition-opacity p-1 -m-1"
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={inputId}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          autoComplete="off"
          className="flex-1 min-w-[120px] bg-transparent text-sm placeholder:text-fg/30 focus:outline-none py-1"
        />
      </div>

      {suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-bg border border-fg/15 text-sm shadow-sm max-h-48 overflow-y-auto">
          {suggestions.map((lang, i) => (
            <li
              key={lang}
              onMouseDown={() => addTag(lang)}
              className={`px-3 py-2 cursor-pointer ${
                i === activeIndex ? "bg-fg text-bg" : "hover:bg-fg/5"
              }`}
            >
              {lang}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
