"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/i18n/hook";

interface ConversationSummary {
  id: string;
  participants: { id: string; name: string; profilePhoto: string | null }[];
  messages: { content: string; createdAt: string; senderId: string; read: boolean }[];
}

export function ChatList({ conversations }: { conversations: ConversationSummary[] }) {
  const { data: session } = useSession();
  const { t } = useTranslation();

  if (conversations.length === 0) {
    return <p className="text-sm text-muted">{t("chat.noConversations")}</p>;
  }

  return (
    <div className="divide-y divide-fg/10">
      {conversations.map((conv) => {
        const other = conv.participants.find((p) => p.id !== session?.user?.id);
        const last = conv.messages[0];
        const isFromOther = last && last.senderId !== session?.user?.id;
        const isUnread = isFromOther && !last.read;
        const isWaiting = last && last.senderId === session?.user?.id;

        return (
          <Link
            key={conv.id}
            href={`/chat/${conv.id}`}
            className="block py-5 hover:opacity-60 transition-opacity"
          >
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                {isUnread && (
                  <span className="text-[8px] text-fg leading-none">●</span>
                )}
                <span className={`text-sm ${isUnread ? "font-medium" : isWaiting ? "text-muted" : ""}`}>
                  {other?.name || "User"}
                </span>
              </div>
              {last && (
                <span className="text-xs text-muted">
                  {new Date(last.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
            {last && (
              <p className={`text-xs mt-1 truncate ${isUnread ? "text-fg" : "text-muted"}`}>
                {isWaiting && <span className="font-mono">{t("chat.you")}: </span>}
                {last.content}
              </p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
