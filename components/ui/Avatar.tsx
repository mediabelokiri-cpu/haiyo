import React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  isOnline?: boolean;
  className?: string;
}

export function Avatar({
  src,
  name,
  size = "md",
  isOnline,
  className,
}: AvatarProps) {
  const sizeMap = {
    sm: "w-9 h-9 text-[12px]",
    md: "w-12 h-12 text-[15px]",
    lg: "w-16 h-16 text-[18px]",
    xl: "w-24 h-24 text-[24px]",
  };

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <div
        className={cn(
          "rounded-full overflow-hidden bg-[#eaf5ef] border border-[#E9E9EE] flex items-center justify-center font-bold text-[#267a50]",
          sizeMap[size]
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span>{initials || "H"}</span>
        )}
      </div>

      {isOnline && (
        <span
          aria-label="Online"
          className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#22C55E] border-2 border-white"
        />
      )}
    </div>
  );
}
