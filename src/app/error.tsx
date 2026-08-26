"use client";

import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/hook";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="text-center">
        <p className="text-sm text-muted font-mono mb-4">{t("errors.title")}</p>
        <Button onClick={reset} variant="outline">
          {t("errors.retry")}
        </Button>
      </div>
    </div>
  );
}
