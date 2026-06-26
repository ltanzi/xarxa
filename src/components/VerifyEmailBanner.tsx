"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTranslation } from "@/i18n/hook";

export default function VerifyEmailBanner() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  if (!session?.user) return null;
  if (session.user.emailVerified) return null;
  return (
    <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 text-sm text-amber-900 text-center">
      {t("verification.bannerText")}{" "}
      <Link href="/auth/verify-pending" className="underline">
        {t("verification.bannerLink")}
      </Link>
    </div>
  );
}
