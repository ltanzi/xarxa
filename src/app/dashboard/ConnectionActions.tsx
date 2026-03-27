"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function ConnectionActions({ connectionId }: { connectionId: string }) {
  const [loading, setLoading] = useState(false);
  const [resolved, setResolved] = useState(false);
  const router = useRouter();

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

  if (resolved) return <span className="text-sm text-gray-400">Done</span>;

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => handleAction("ACCEPTED")} disabled={loading}>
        Accept
      </Button>
      <Button size="sm" variant="outline" onClick={() => handleAction("REJECTED")} disabled={loading}>
        Reject
      </Button>
    </div>
  );
}
