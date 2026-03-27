"use client";

import React, { createContext, ReactNode } from "react";
import en from "./locales/en.json";

type Translations = typeof en;

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return path;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : path;
}

interface I18nContextType {
  t: (key: string) => string;
  locale: string;
}

export const I18nContext = createContext<I18nContextType>({
  t: (key: string) => key,
  locale: "en",
});

const locales: Record<string, Translations> = { en };

export function I18nProvider({
  children,
  locale = "en",
}: {
  children: ReactNode;
  locale?: string;
}) {
  const translations = locales[locale] || locales.en;

  const t = (key: string): string => {
    return getNestedValue(translations as unknown as Record<string, unknown>, key);
  };

  return (
    <I18nContext.Provider value={{ t, locale }}>
      {children}
    </I18nContext.Provider>
  );
}
