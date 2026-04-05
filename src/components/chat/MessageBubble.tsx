import { formatTime } from "@/lib/date";

interface MessageBubbleProps {
  content: string;
  isOwn: boolean;
  timestamp: string;
}

export function MessageBubble({ content, isOwn, timestamp }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] ${isOwn ? "text-right" : ""}`}>
        <p className={`text-sm leading-relaxed ${isOwn ? "bg-fg text-bg" : "bg-soft text-fg"} px-4 py-2.5 inline-block`}>
          {content}
        </p>
        <p className="text-[10px] text-muted mt-1">
          {formatTime(timestamp)}
        </p>
      </div>
    </div>
  );
}
