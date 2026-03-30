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
    <div>
      {conversations.map((conv) => {
        const other = conv.participants.find((p) => p.id !== session?.user?.id);
        const last = conv.messages[0];

        return (
          <Link
            key={conv.id}
            href={`/chat/${conv.id}`}
            className="group block py-6 border-t border-fg/8"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-display text-xl font-400 group-hover:text-accent transition-colors duration-300">
                {other?.name || "User"}
              </span>
              {last && (
                <span className="font-label text-muted">
                  {new Date(last.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
            {last && (
              <p className="text-sm text-muted mt-2 truncate max-w-md">{last.content}</p>
            )}
          </Link>
        );
      })}
      <div className="border-t border-fg/8" />
    </div>
  );
}
