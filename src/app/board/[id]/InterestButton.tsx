"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/hook";

interface InterestButtonProps {
  postId: string;
  existingStatus: string | null;
}

export function InterestButton({ postId, existingStatus }: InterestButtonProps) {
  const [status, setStatus] = useState(existingStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  if (status === "ACCEPTED") {
    return <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{t("posts.connected")}</span>;
  }

  if (status === "PENDING") {
    return <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{t("posts.interestSent")}</span>;
  }

  if (status === "REJECTED") {
    return null;
  }

  async function handleInterest() {
    setLoading(true);
    setError(false);
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
        console.error("[InterestButton]", res.status, await res.text().catch(() => ""));
        setError(true);
      }
    } catch (e) {
      console.error("[InterestButton]", e);
      setError(true);
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={handleInterest} disabled={loading} size="sm">
        {loading ? "..." : t("posts.interested")}
      </Button>
      {error && <span className="text-xs text-accent">{t("common.error")}</span>}
    </div>
  );
}
