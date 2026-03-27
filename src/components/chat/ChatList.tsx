"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Avatar } from "@/components/ui/Avatar";

interface ConversationSummary {
  id: string;
  participants: { id: string; name: string; profilePhoto: string | null }[];
  messages: { content: string; createdAt: string; senderId: string }[];
}

export function ChatList({ conversations }: { conversations: ConversationSummary[] }) {
  const { data: session } = useSession();

  if (conversations.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <p>No conversations yet.</p>
        <p className="text-sm mt-1">Connect with someone to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {conversations.map((conv) => {
        const otherParticipant = conv.participants.find(
          (p) => p.id !== session?.user?.id
        );
        const lastMessage = conv.messages[0];

        return (
          <Link
            key={conv.id}
            href={`/chat/${conv.id}`}
            className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
          >
            <Avatar
              name={otherParticipant?.name || "User"}
              src={otherParticipant?.profilePhoto}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {otherParticipant?.name || "User"}
              </p>
              {lastMessage && (
                <p className="text-xs text-gray-500 truncate">{lastMessage.content}</p>
              )}
            </div>
            {lastMessage && (
              <span className="text-xs text-gray-400">
                {new Date(lastMessage.createdAt).toLocaleDateString()}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
