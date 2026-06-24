"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/hook";

export default function ResendButton({ email }: { email: string }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function resend() {
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <button
      onClick={resend}
      disabled={status === "sending" || status === "sent"}
      className="mt-8 px-5 py-2.5 border border-fg text-fg text-sm font-mono uppercase tracking-wider hover:bg-fg hover:text-bg transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-fg"
    >
      {status === "sent" ? t("verification.resent") : status === "sending" ? "…" : t("verification.resend")}
    </button>
  );
}
