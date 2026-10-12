import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  href?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showWordmark?: boolean;
}

/**
 * Official HAIYO square mark (logourlbar.png — "h!")
 */
export function BrandMarkSvg({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logourlbar.png"
      alt="HAIYO"
      draggable={false}
      className={cn("w-8 h-8 rounded-[8px] object-contain shrink-0", className)}
    />
  );
}

/**
 * Official HAIYO Header/Footer Logo (logoheaderfooter.png — "ha!yo.")
 * When showWordmark={false}, renders the compact square mark (logourlbar.png).
 */
export function BrandLogo({
  href = "/",
  size = "md",
  className,
  showWordmark = true,
}: BrandLogoProps) {
  const sizeStyles = {
    sm: {
      wordmark: "h-6 w-auto",
      mark: "w-7 h-7",
    },
    md: {
      wordmark: "h-7 sm:h-8 w-auto",
      mark: "w-8 h-8",
    },
    lg: {
      wordmark: "h-9 sm:h-10 w-auto",
      mark: "w-9 h-9",
    },
  };

  const content = (
    <span
      className={cn(
        "inline-flex items-center select-none shrink-0",
        className
      )}
    >
      {showWordmark ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logoheaderfooter.png"
          alt="HAIYO"
          draggable={false}
          className={cn("object-contain", sizeStyles[size].wordmark)}
        />
      ) : (
        <BrandMarkSvg className={sizeStyles[size].mark} />
      )}
    </span>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      aria-label="HAIYO Beranda"
      className="inline-flex items-center focus-visible:outline-none"
    >
      {content}
    </Link>
  );
}
