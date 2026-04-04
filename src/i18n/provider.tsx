"use client";

import React, { createContext, ReactNode, useState, useCallback } from "react";
import en from "./locales/en.json";
import es from "./locales/es.json";
import ca from "./locales/ca.json";

type Translations = typeof en;

const locales: Record<string, Translations> = { en, es, ca };

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") return path;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : path;
}

interface I18nContextType {
  t: (key: string) => string;
  locale: string;
  setLocale: (locale: string) => void;
}

export const I18nContext = createContext<I18nContextType>({
  t: (key: string) => key,
  locale: "en",
  setLocale: () => {},
});

export function I18nProvider({
  children,
  initialLocale = "en",
}: {
  children: ReactNode;
  initialLocale?: string;
}) {
  const [locale, setLocaleState] = useState(initialLocale);

  const setLocale = useCallback((newLocale: string) => {
    setLocaleState(newLocale);
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
  }, []);

  const translations = locales[locale] || locales.en;

  const t = useCallback(
    (key: string): string =>
      getNestedValue(translations as unknown as Record<string, unknown>, key),
    [translations]
  );

  return (
    <I18nContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}
