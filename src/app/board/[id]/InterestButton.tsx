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
  const router = useRouter();
  const { t } = useTranslation();

  if (status === "ACCEPTED") {
    return (
      <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-green-100 text-green-800">
        Connected
      </span>
    );
  }

  if (status === "PENDING") {
    return (
      <Button variant="secondary" disabled>
        {t("posts.alreadyInterested")}
      </Button>
    );
  }

  if (status === "REJECTED") {
    return null;
  }

  async function handleInterest() {
    setLoading(true);
    const res = await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });

    if (res.ok) {
      setStatus("PENDING");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Button onClick={handleInterest} disabled={loading}>
      {loading ? t("common.loading") : t("posts.interested")}
    </Button>
  );
}
