"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface InterestButtonProps {
  postId: string;
  existingStatus: string | null;
}

export function InterestButton({ postId, existingStatus }: InterestButtonProps) {
  const [status, setStatus] = useState(existingStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (status === "ACCEPTED") {
    return <span className="font-mono text-[11px] uppercase tracking-wider text-muted">Connected</span>;
  }

  if (status === "PENDING") {
    return <span className="font-mono text-[11px] uppercase tracking-wider text-muted">Interest sent</span>;
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
    <Button onClick={handleInterest} disabled={loading} size="sm">
      {loading ? "..." : "I\u2019m interested"}
    </Button>
  );
}
