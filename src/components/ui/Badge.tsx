interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "offer" | "request" | "pending" | "accepted" | "rejected";
  color?: "coral" | "lime" | "violet" | "sky" | "sunflower" | "peach" | "blush" | "mint";
  className?: string;
}

const badgeVariants = {
  default: "bg-gray-100 text-gray-700 border border-gray-200",
  offer: "bg-lime/15 text-lime border border-lime/30",
  request: "bg-violet/15 text-violet border border-violet/30",
  pending: "bg-sunflower/15 text-yellow-700 border border-sunflower/30",
  accepted: "bg-lime/15 text-green-700 border border-lime/30",
  rejected: "bg-coral/15 text-coral border border-coral/30",
};

const colorMap = {
  coral: "bg-coral/15 text-coral border border-coral/30",
  lime: "bg-lime/15 text-green-700 border border-lime/30",
  violet: "bg-violet/15 text-violet border border-violet/30",
  sky: "bg-sky/15 text-sky border border-sky/30",
  sunflower: "bg-sunflower/15 text-yellow-700 border border-sunflower/30",
  peach: "bg-peach/15 text-orange-700 border border-peach/30",
  blush: "bg-blush/15 text-pink-700 border border-blush/30",
  mint: "bg-mint/15 text-green-700 border border-mint/30",
};

export function Badge({ children, variant = "default", color, className = "" }: BadgeProps) {
  const classes = color ? colorMap[color] : badgeVariants[variant];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes} ${className}`}
    >
      {children}
    </span>
  );
}
