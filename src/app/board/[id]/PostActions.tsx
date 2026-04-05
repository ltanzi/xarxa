"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/i18n/hook";

interface PostActionsProps {
  postId: string;
  closed: boolean;
}

export function PostActions({ postId, closed }: PostActionsProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isClosed, setIsClosed] = useState(closed);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(false);

  async function handleDelete() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard");
        return;
      }
      setError(true);
    } catch (err) {
      console.error("[PostActions] delete failed:", err);
      setError(true);
    }
    setLoading(false);
  }

  async function handleToggleClosed() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closed: !isClosed }),
      });
      if (res.ok) {
        setIsClosed(!isClosed);
        router.refresh();
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("[PostActions] toggle failed:", err);
      setError(true);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-end gap-3">
      <div className="flex gap-4 text-xs">
        <Link href={`/board/${postId}/edit`} className="underline underline-offset-4 hover:no-underline">
          {t("posts.editPost")}
        </Link>
        <button
          onClick={handleToggleClosed}
          disabled={loading}
          className="underline underline-offset-4 hover:no-underline disabled:opacity-40"
        >
          {isClosed ? t("posts.reopenPost") : t("posts.closePost")}
        </button>
        <button
          onClick={() => setConfirming(true)}
          disabled={loading}
          className="text-accent hover:opacity-60 disabled:opacity-40"
        >
          {t("posts.deletePost")}
        </button>
      </div>

      {error && (
        <span className="text-accent text-xs">{t("common.error")}</span>
      )}

      {confirming && (
        <div className="border border-fg/15 px-4 py-3 flex items-center gap-4 text-xs">
          <span className="text-muted">{t("posts.confirmDelete")}</span>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-accent font-medium hover:opacity-60 disabled:opacity-40"
          >
            {t("posts.deletePost")}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-muted hover:text-fg transition-colors"
          >
            {t("common.cancel")}
          </button>
        </div>
      )}
    </div>
  );
}
