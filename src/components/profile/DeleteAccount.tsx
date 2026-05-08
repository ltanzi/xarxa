"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useTranslation } from "@/i18n/hook";

export function DeleteAccount() {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleDelete() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (res.ok) {
        signOut({ callbackUrl: "/" });
        return;
      }
      setError(true);
    } catch (err) {
      console.error("[DeleteAccount] delete failed:", err);
      setError(true);
    }
    setLoading(false);
  }

  return (
    <>
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="text-sm text-accent hover:opacity-60 transition-opacity underline underline-offset-4 hover:no-underline"
        >
          {t("profile.deleteAccount")}
        </button>
      ) : (
        <div className="basis-full border border-fg/15 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
          <span className="text-muted flex-1">
            {t("profile.confirmDeleteAccount")}
            {error && <span className="block text-accent mt-1">{t("common.error")}</span>}
          </span>
          <div className="flex gap-4">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="text-accent font-medium hover:opacity-60 disabled:opacity-40"
            >
              {t("profile.deleteAccount")}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-muted hover:text-fg transition-colors"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
