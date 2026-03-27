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
        className={`rounded-full object-cover ${sizeMap[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-medium ${sizeMap[size]} ${className}`}
    >
      {initials}
    </div>
  );
}
