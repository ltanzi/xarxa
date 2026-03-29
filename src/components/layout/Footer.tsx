"use client";

import { useTranslation } from "@/i18n/hook";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t-2 border-dashed border-gray-200 bg-cream py-8 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()}{" "}
          <span className="font-handwritten text-lg text-gray-500">{t("common.appName")}</span>
          {" "}&mdash; {t("common.tagline")}
        </p>
      </div>
    </footer>
  );
}
