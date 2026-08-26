"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTranslation } from "@/i18n/hook";

export default function VerifyEmailBanner() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  if (!session?.user) return null;
  if (session.user.emailVerified) return null;
  // mt-14 clears the fixed h-14 navbar — without it this banner rendered
  // entirely underneath the nav and new users never saw it.
  return (
    <div className="mt-14 bg-soft border-b border-fg/15 px-4 py-2.5 text-center font-mono text-xs uppercase tracking-wider text-fg">
      {t("verification.bannerText")}{" "}
      <Link href="/auth/verify-pending" className="underline underline-offset-4 hover:no-underline">
        {t("verification.bannerLink")}
      </Link>
    </div>
  );
}
