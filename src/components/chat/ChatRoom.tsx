"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { MessageBubble } from "./MessageBubble";
import { io, Socket } from "socket.io-client";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; name: string; profilePhoto: string | null };
}

export function ChatRoom({ conversationId, initialMessages }: { conversationId: string; initialMessages: Message[] }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const socket = io({ path: "/api/socketio" });
    socketRef.current = socket;

    socket.emit("join-conversation", conversationId);

    socket.on("new-message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, [conversationId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !session?.user) return;

    setSending(true);

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: newMessage,
      createdAt: new Date().toISOString(),
      senderId: session.user.id,
      sender: { id: session.user.id, name: session.user.name, profilePhoto: null },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    const messageContent = newMessage;
    setNewMessage("");

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
    }

    setSending(false);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            content={msg.content}
            senderName={msg.sender.name}
            senderPhoto={msg.sender.profilePhoto}
            isOwn={msg.senderId === session?.user?.id}
            timestamp={msg.createdAt}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-fg/10 p-4 flex gap-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 bg-transparent border-b border-fg/15 px-0 py-2 text-sm focus:outline-none focus:border-fg transition-colors"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="text-sm underline underline-offset-4 hover:no-underline disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
