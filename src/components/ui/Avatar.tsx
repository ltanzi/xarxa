import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-7 w-7 text-[9px]",
  md: "h-9 w-9 text-[10px]",
  lg: "h-14 w-14 text-xs",
};

const imageSizeMap = { sm: 28, md: 36, lg: 56 };

export function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

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
    <div className={`rounded-full bg-soft text-muted flex items-center justify-center font-label ${sizeMap[size]} ${className}`}>
      {initials}
    </div>
  );
}
