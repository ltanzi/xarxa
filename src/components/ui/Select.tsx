"use client";

import { useState, useRef, useEffect } from "react";

interface SelectProps {
  id?: string;
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
}

export function Select({ label, error, options, value, onChange, id }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
        setActiveIndex(options.findIndex((o) => o.value === value));
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
      if (activeIndex >= 0) {
        selectOption(options[activeIndex].value);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  function selectOption(val: string) {
    onChange?.({ target: { value: val } });
    setOpen(false);
    setActiveIndex(-1);
  }

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
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        className={`block w-full border-b bg-transparent px-0 py-2 text-sm text-left focus:outline-none transition-colors ${
          error ? "border-accent" : "border-fg/15 focus:border-fg"
        }`}
      >
        {selected?.label}
      </button>
      {open && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-bg border border-fg/15 text-sm shadow-sm max-h-52 overflow-y-auto">
          {options.map((opt, i) => (
            <li
              key={opt.value}
              onMouseDown={() => selectOption(opt.value)}
              className={`px-3 py-2 cursor-pointer ${
                i === activeIndex ? "bg-fg text-bg" : opt.value === value ? "text-fg" : "hover:bg-fg/5"
              }`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-1.5 text-xs text-accent">{error}</p>}
    </div>
  );
}
