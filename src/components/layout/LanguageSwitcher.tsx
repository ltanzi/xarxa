"use client";

import { useTranslation } from "@/i18n/hook";
import { useRouter } from "next/navigation";

const LANGS = ["en", "es", "ca"] as const;

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();
  const router = useRouter();

  function handleSetLocale(lang: string) {
    setLocale(lang);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider">
      {LANGS.map((lang, i) => (
        <span key={lang} className="flex items-center gap-1">
          {i > 0 && <span className="text-fg/15">/</span>}
          <button
            onClick={() => handleSetLocale(lang)}
            className={locale === lang ? "text-fg" : "text-muted hover:text-fg transition-colors"}
          >
            {lang}
          </button>
        </span>
      ))}
    </div>
  );
}
