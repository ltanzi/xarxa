"use client";

import { useTranslation } from "@/i18n/hook";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t bg-white py-8 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} {t("common.appName")} &mdash; {t("common.tagline")}
        </p>
      </div>
    </footer>
  );
}
