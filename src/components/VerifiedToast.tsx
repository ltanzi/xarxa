"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/i18n/hook";

// Reads ?verified=1 from the URL, refreshes the NextAuth session so the
// JWT picks up the new emailVerified value (without requiring a
// sign-out + sign-in), then clears the param and shows a short toast.
export default function VerifiedToast() {
  const params = useSearchParams();
  const router = useRouter();
  const { update } = useSession();
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (params.get("verified") !== "1") return;
    // Trigger the jwt callback's trigger==="update" branch in auth.ts
    update().catch(() => null);
    setShow(true);
    // Clear the query so a refresh doesn't re-trigger
    const url = new URL(window.location.href);
    url.searchParams.delete("verified");
    router.replace(url.pathname + (url.search ? `?${url.searchParams.toString()}` : ""), { scroll: false });
    const id = window.setTimeout(() => setShow(false), 4000);
    return () => window.clearTimeout(id);
  }, [params, router, update]);

  if (!show) return null;

  return (
    <div
      role="status"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-fg text-bg px-5 py-2.5 text-sm font-mono uppercase tracking-wider"
    >
      {t("verification.verifiedToast")}
    </div>
  );
}
