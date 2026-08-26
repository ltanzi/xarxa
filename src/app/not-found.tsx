import Link from "next/link";
import { getTranslations } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getTranslations();
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="text-center">
        <p className="text-sm text-muted font-mono mb-4">{t("errors.notFoundTitle")}</p>
        <Link href="/" className="text-sm underline underline-offset-4 hover:no-underline">
          {t("errors.goHome")}
        </Link>
      </div>
    </div>
  );
}
