import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
};

const imageSizeMap = {
  sm: 32,
  md: 40,
  lg: 64,
};

const bgColors = [
  "bg-coral/20 text-coral",
  "bg-violet/20 text-violet",
  "bg-lime/20 text-green-700",
  "bg-sky/20 text-sky",
  "bg-sunflower/20 text-yellow-700",
  "bg-peach/20 text-orange-700",
  "bg-mint/20 text-green-600",
  "bg-blush/20 text-pink-600",
];

function nameToColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length];
}

export function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={imageSizeMap[size]}
        height={imageSizeMap[size]}
        className={`rounded-full object-cover border-2 border-dashed border-gray-300 ${sizeMap[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold ${nameToColor(name)} ${sizeMap[size]} ${className}`}
    >
      {initials}
    </div>
  );
}
