"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/hook";

export function ConnectionActions({ connectionId }: { connectionId: string }) {
  const [actionInProgress, setActionInProgress] = useState<"ACCEPTED" | "REJECTED" | null>(null);
  const [resolved, setResolved] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  async function handleAction(status: "ACCEPTED" | "REJECTED") {
    setActionInProgress(status);
    setError(false);
    try {
      const res = await fetch(`/api/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setResolved(true);
        router.refresh();
        return;
      }
      setError(true);
    } catch (e) {
      console.error("[ConnectionActions]", e);
      setError(true);
    }
    setActionInProgress(null);
  }

  if (resolved) return <span className="text-xs text-muted">{t("common.done")}</span>;

  return (
    <div className="flex items-center gap-4 text-xs">
      <button
        onClick={() => handleAction("ACCEPTED")}
        disabled={actionInProgress !== null}
        className="underline underline-offset-4 hover:no-underline disabled:opacity-40"
      >
        {actionInProgress === "ACCEPTED" ? "..." : t("dashboard.accept")}
      </button>
      <button
        onClick={() => handleAction("REJECTED")}
        disabled={actionInProgress !== null}
        className="text-muted hover:text-fg transition-colors disabled:opacity-40"
      >
        {actionInProgress === "REJECTED" ? "..." : t("dashboard.decline")}
      </button>
      {error && <span className="text-accent">{t("common.error")}</span>}
    </div>
  );
}
