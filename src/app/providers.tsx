"use client";

import { SessionProvider } from "next-auth/react";
import { I18nProvider } from "@/i18n/provider";

export function Providers({
  children,
  initialLocale = "en",
}: {
  children: React.ReactNode;
  initialLocale?: string;
}) {
  return (
    <SessionProvider>
      <I18nProvider initialLocale={initialLocale}>{children}</I18nProvider>
    </SessionProvider>
  );
}
