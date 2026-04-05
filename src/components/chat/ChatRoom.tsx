"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageBubble } from "./MessageBubble";
import { Avatar } from "@/components/ui/Avatar";
import { io, Socket } from "socket.io-client";
import { useTranslation } from "@/i18n/hook";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; name: string; profilePhoto: string | null };
}

function getDateLabel(dateStr: string, t: (key: string) => string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return t("chat.today");
  if (date.toDateString() === yesterday.toDateString()) return t("chat.yesterday");
  return date.toLocaleDateString("en-GB");
}

interface Participant {
  id: string;
  name: string;
  profilePhoto: string | null;
}

export function ChatRoom({ conversationId, initialMessages, otherParticipant, backLabel }: { conversationId: string; initialMessages: Message[]; otherParticipant: Participant | null; backLabel: string }) {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("notifications:refresh"));
  }, []);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const connectSocket = useCallback(() => {
    const socket = io({
      path: "/api/socketio",
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-conversation", conversationId);
    });

    socket.on("new-message", (message: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    return socket;
  }, [conversationId]);

  useEffect(() => {
    const socket = connectSocket();
    return () => {
      socket.disconnect();
    };
  }, [connectSocket]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !session?.user) return;

    setSending(true);
    setSendError(false);

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: newMessage,
      createdAt: new Date().toISOString(),
      senderId: session.user.id,
      sender: { id: session.user.id, name: session.user.name ?? "", profilePhoto: null },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    const messageContent = newMessage;
    setNewMessage("");

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent }),
      });

      if (res.ok) {
        const saved = await res.json();
        setMessages((prev) => prev.map((m) => (m.id === optimisticMessage.id ? saved : m)));

        socketRef.current?.emit("send-message", {
          conversationId,
          message: saved,
        });
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
        setNewMessage(messageContent);
        setSendError(true);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      setNewMessage(messageContent);
      setSendError(true);
    }

    setSending(false);
  }

  // Group messages by date for date separators
  let lastDateLabel = "";

  return (
    <div className="flex flex-col h-[calc(100dvh-10rem)]">
      <div className="border-b border-fg/10 p-4 flex items-center gap-3">
        <button
          onClick={() => { router.push("/chat"); router.refresh(); }}
          className="text-muted hover:text-fg transition-colors"
        >
          &larr; {backLabel}
        </button>
        {otherParticipant && (
          <Link href={`/profile/${otherParticipant.id}`} className="flex items-center gap-2 hover:opacity-80">
            <Avatar name={otherParticipant.name} src={otherParticipant.profilePhoto} size="sm" />
            <span className="font-medium text-sm">{otherParticipant.name}</span>
          </Link>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => {
          const dateLabel = getDateLabel(msg.createdAt, t);
          const showDateSeparator = dateLabel !== lastDateLabel;
          lastDateLabel = dateLabel;

          return (
            <div key={msg.id}>
              {showDateSeparator && (
                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 border-t border-fg/10" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted">{dateLabel}</span>
                  <div className="flex-1 border-t border-fg/10" />
                </div>
              )}
              <MessageBubble
                content={msg.content}
                senderName={msg.sender.name}
                senderPhoto={msg.sender.profilePhoto}
                isOwn={msg.senderId === session?.user?.id}
                timestamp={msg.createdAt}
              />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-fg/10 p-4 pb-6">
        {sendError && (
          <p className="text-xs text-accent mb-2">{t("common.error")}</p>
        )}
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => { setNewMessage(e.target.value); setSendError(false); }}
            placeholder={t("chat.typeMessage")}
            className="flex-1 bg-transparent border-b border-fg/15 px-0 py-2 text-sm focus:outline-none focus:border-fg transition-colors"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="text-sm underline underline-offset-4 hover:no-underline disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("chat.send")}
          </button>
        </div>
      </form>
    </div>
  );
}
