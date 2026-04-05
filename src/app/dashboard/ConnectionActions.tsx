"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/hook";

export function ConnectionActions({ connectionId }: { connectionId: string }) {
  const [loading, setLoading] = useState(false);
  const [resolved, setResolved] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  async function handleAction(status: "ACCEPTED" | "REJECTED") {
    setLoading(true);
    const res = await fetch(`/api/connections/${connectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      setResolved(true);
      router.refresh();
    }
    setLoading(false);
  }

  if (resolved) return <span className="text-xs text-muted">{t("common.done")}</span>;

  return (
    <div className="flex gap-4 text-xs">
      <button
        onClick={() => handleAction("ACCEPTED")}
        disabled={loading}
        className="underline underline-offset-4 hover:no-underline disabled:opacity-40"
      >
        {loading ? "..." : t("dashboard.accept")}
      </button>
      <button
        onClick={() => handleAction("REJECTED")}
        disabled={loading}
        className="text-muted hover:text-fg transition-colors disabled:opacity-40"
      >
        {loading ? "..." : t("dashboard.decline")}
      </button>
    </div>
  );
}
