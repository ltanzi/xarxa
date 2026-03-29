interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "offer" | "request" | "pending" | "accepted" | "rejected";
  className?: string;
}

const badgeVariants = {
  default: "text-muted",
  offer: "text-fg",
  request: "text-accent",
  pending: "text-muted",
  accepted: "text-fg",
  rejected: "text-accent",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-mono text-[11px] uppercase tracking-wider ${badgeVariants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
