"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

interface ConversationSummary {
  id: string;
  participants: { id: string; name: string; profilePhoto: string | null }[];
  messages: { content: string; createdAt: string; senderId: string }[];
}

export function ChatList({ conversations }: { conversations: ConversationSummary[] }) {
  const { data: session } = useSession();

  if (conversations.length === 0) {
    return <p className="text-sm text-muted">No conversations yet.</p>;
  }

  return (
    <div className="divide-y divide-fg/10">
      {conversations.map((conv) => {
        const other = conv.participants.find((p) => p.id !== session?.user?.id);
        const last = conv.messages[0];

        return (
          <Link
            key={conv.id}
            href={`/chat/${conv.id}`}
            className="block py-5 hover:opacity-60 transition-opacity"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-sm">{other?.name || "User"}</span>
              {last && (
                <span className="text-xs text-muted">
                  {new Date(last.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
            {last && (
              <p className="text-xs text-muted mt-1 truncate">{last.content}</p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
