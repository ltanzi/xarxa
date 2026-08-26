"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/hook";

interface InterestButtonProps {
  postId: string;
  existingStatus: string | null;
}

export function InterestButton({ postId, existingStatus }: InterestButtonProps) {
  const [status, setStatus] = useState(existingStatus);
  const [loading, setLoading] = useState(false);
  // i18n key of the error to show; "verification.blockedTooltip" for the
  // soft wall, "common.error" for everything else.
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useTranslation();

  if (status === "ACCEPTED") {
    return <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{t("posts.connected")}</span>;
  }

  if (status === "PENDING") {
    return (
      <div>
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{t("posts.interestSent")}</span>
        {/* Without this line the requester is told nothing about what
            happens next — the loop's next step was invisible. */}
        <p className="mt-1 text-xs text-muted">{t("posts.interestSentHint")}</p>
      </div>
    );
  }

  if (status === "REJECTED") {
    // Used to render null — the post just silently lost its action button.
    return <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{t("posts.notAccepted")}</span>;
  }

  async function handleInterest() {
    setLoading(true);
    setErrorKey(null);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (res.ok) {
        setStatus("PENDING");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({} as { error?: string }));
        console.error("[InterestButton]", res.status, data.error ?? "");
        setErrorKey(
          res.status === 403 && data.error === "EMAIL_NOT_VERIFIED"
            ? "verification.blockedTooltip"
            : "common.error"
        );
      }
    } catch (e) {
      console.error("[InterestButton]", e);
      setErrorKey("common.error");
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={handleInterest} disabled={loading} size="sm">
        {loading ? "..." : t("posts.interested")}
      </Button>
      {errorKey === "verification.blockedTooltip" ? (
        <Link href="/auth/verify-pending" className="text-xs text-accent underline underline-offset-4 hover:no-underline">
          {t(errorKey)}
        </Link>
      ) : errorKey ? (
        <span className="text-xs text-accent">{t(errorKey)}</span>
      ) : null}
    </div>
  );
}
