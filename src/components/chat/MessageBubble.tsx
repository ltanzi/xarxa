import { Avatar } from "@/components/ui/Avatar";

interface MessageBubbleProps {
  content: string;
  senderName: string;
  senderPhoto?: string | null;
  isOwn: boolean;
  timestamp: string;
}

export function MessageBubble({ content, senderName, senderPhoto, isOwn, timestamp }: MessageBubbleProps) {
  return (
    <div className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
      <Avatar name={senderName} src={senderPhoto} size="sm" />
      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-lg px-4 py-2 text-sm ${
            isOwn
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-900"
          }`}
        >
          {content}
        </div>
        <p className={`text-xs text-gray-400 mt-1 ${isOwn ? "text-right" : ""}`}>
          {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
