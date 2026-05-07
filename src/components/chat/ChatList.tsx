"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/hook";
import { formatDate } from "@/lib/date";

interface ConversationSummary {
  id: string;
  participants: { id: string; name: string; profilePhoto: string | null }[];
  messages: { content: string; createdAt: string; senderId: string; read: boolean }[];
  connection: { post: { title: string } } | null;
}

export function ChatList({ conversations }: { conversations: ConversationSummary[] }) {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const router = useRouter();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleDelete(id: string) {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConfirmingId(null);
        setLoading(false);
        router.refresh();
        return;
      }
      setError(true);
    } catch (err) {
      console.error("[ChatList] delete failed:", err);
      setError(true);
    }
    setLoading(false);
  }

  if (conversations.length === 0) {
    return (
      <div>
        <p className="text-sm text-muted">{t("chat.noConversations")}</p>
        <Link href="/board" className="text-xs underline underline-offset-4 hover:no-underline mt-2 inline-block">{t("chat.noConversationsCta")}</Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-fg/10">
      {conversations.map((conv) => {
        const other = conv.participants.find((p) => p.id !== session?.user?.id);
        const last = conv.messages[0];
        const isFromOther = last && last.senderId !== session?.user?.id;
        const isUnread = isFromOther && !last.read;
        const isWaiting = last && last.senderId === session?.user?.id;
        const isConfirming = confirmingId === conv.id;

        return (
          <div key={conv.id} className="py-5">
            <div className="flex items-start justify-between gap-4">
              <Link
                href={`/chat/${conv.id}`}
                className="flex-1 min-w-0 hover:opacity-60 transition-opacity"
              >
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2 min-w-0">
                    {isUnread && (
                      <span className="text-[8px] text-fg leading-none shrink-0">●</span>
                    )}
                    <span className={`text-sm truncate ${isUnread ? "font-medium" : isWaiting ? "text-muted" : ""}`}>
                      {other?.name || "User"}
                    </span>
                  </div>
                  {last && (
                    <span className="text-xs text-muted shrink-0 ml-3">
                      {formatDate(last.createdAt)}
                    </span>
                  )}
                </div>
                {conv.connection?.post.title && (
                  <p className="text-[11px] text-muted font-mono uppercase tracking-wider mt-0.5 truncate">
                    {conv.connection.post.title}
                  </p>
                )}
                {last && (
                  <p className={`text-xs mt-1 truncate ${isUnread ? "text-fg" : "text-muted"}`}>
                    {isWaiting && <span className="font-mono">{t("chat.you")}: </span>}
                    {(last.content ?? "").replace(/\s+/g, " ")}
                  </p>
                )}
              </Link>
              <button
                onClick={() => { setConfirmingId(isConfirming ? null : conv.id); setError(false); }}
                className="text-xs text-muted hover:text-accent transition-colors shrink-0 mt-0.5"
              >
                ×
              </button>
            </div>

            {isConfirming && (
              <div className="border border-fg/15 px-4 py-3 mt-3 flex items-center gap-4 text-xs">
                <span className="text-muted flex-1">
                  {t("chat.confirmDelete")}
                  {error && <span className="block text-accent mt-1">{t("common.error")}</span>}
                </span>
                <button
                  onClick={() => handleDelete(conv.id)}
                  disabled={loading}
                  className="text-accent font-medium hover:opacity-60 disabled:opacity-40"
                >
                  {t("chat.deleteChat")}
                </button>
                <button
                  onClick={() => { setConfirmingId(null); setError(false); }}
                  className="text-muted hover:text-fg transition-colors"
                >
                  {t("common.cancel")}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
