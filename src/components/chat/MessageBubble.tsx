interface MessageBubbleProps {
  content: string;
  senderName: string;
  senderPhoto?: string | null;
  isOwn: boolean;
  timestamp: string;
}

export function MessageBubble({ content, senderName, isOwn, timestamp }: MessageBubbleProps) {
  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      <p className="font-label text-muted mb-1.5">{senderName}</p>
      <p className={`text-[15px] leading-relaxed max-w-[75%] px-5 py-3 ${
        isOwn ? "bg-fg text-bg" : "bg-paper text-fg border border-fg/8"
      }`}>
        {content}
      </p>
      <span className="font-label text-muted/60 mt-1.5">
        {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
}
