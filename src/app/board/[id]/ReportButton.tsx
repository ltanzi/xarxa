"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/hook";
import { Select } from "@/components/ui/Select";

const REASONS = ["HATE_SPEECH", "HARASSMENT", "SPAM", "INAPPROPRIATE", "OTHER"] as const;
type Reason = typeof REASONS[number];

export function ReportButton({ postId, alreadyReported, triggerClassName = "" }: { postId: string; alreadyReported: boolean; triggerClassName?: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason>("HATE_SPEECH");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(alreadyReported);
  const [justReported, setJustReported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (justReported) {
    return (
      <div className="basis-full w-full mt-4 pt-4 border-t border-fg/10">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-2">
          {t("report.thanksTitle")}
        </p>
        <p className="text-sm text-fg">{t("report.thanksBody")}</p>
      </div>
    );
  }

  if (done) {
    return (
      <span className={`font-mono text-[11px] uppercase tracking-wider text-muted ${triggerClassName}`}>
        {t("report.alreadyReported")}
      </span>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`font-mono text-[11px] uppercase tracking-wider text-muted hover:text-fg transition-colors ${triggerClassName}`}
      >
        {t("report.report")}
      </button>
    );
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${postId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details: details.trim() || undefined }),
      });
      if (res.ok) {
        setDone(true);
        setJustReported(true);
      } else if (res.status === 409) {
        setDone(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t("common.error"));
      }
    } catch (e) {
      console.error("[ReportButton]", e);
      setError(t("common.error"));
    }
    setLoading(false);
  }

  return (
    <div className="basis-full w-full mt-4 pt-4 border-t border-fg/10">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-3">
        {t("report.title")}
      </p>
      <div className="space-y-3 max-w-md">
        <Select
          value={reason}
          onChange={(e) => setReason(e.target.value as Reason)}
          options={REASONS.map((r) => ({ value: r, label: t(`report.reasons.${r}`) }))}
        />
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={t("report.detailsPlaceholder")}
          maxLength={1000}
          rows={3}
          className="w-full px-3 py-2 bg-transparent border border-fg/20 text-sm focus:outline-none focus:border-fg/40 resize-none"
        />
        {error && <p className="text-xs text-accent">{error}</p>}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-fg text-bg text-xs font-mono uppercase tracking-wider hover:opacity-80 disabled:opacity-40 transition-opacity"
          >
            {loading ? "..." : t("report.submit")}
          </button>
          <button
            onClick={() => { setOpen(false); setError(null); }}
            disabled={loading}
            className="text-xs font-mono uppercase tracking-wider text-muted hover:text-fg transition-colors"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
