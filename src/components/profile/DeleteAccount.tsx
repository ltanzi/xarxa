"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useTranslation } from "@/i18n/hook";

export function DeleteAccount() {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch("/api/profile", { method: "DELETE" });
    if (res.ok) {
      signOut({ callbackUrl: "/" });
    }
    setLoading(false);
  }

  return (
    <div className="pt-12 mt-12 border-t border-fg/10">
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="text-xs text-accent hover:opacity-60 transition-opacity"
        >
          {t("profile.deleteAccount")}
        </button>
      ) : (
        <div className="border border-fg/15 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
          <span className="text-muted flex-1">{t("profile.confirmDeleteAccount")}</span>
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
    </div>
  );
}
