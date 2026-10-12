import React from "react";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { InterestIcon } from "./InterestIcon";

export type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "premium"
  | "success"
  | "warning"
  | "danger";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const styles: Record<BadgeVariant, string> = {
    default: "bg-[#F4F4F8] text-[#6F7078] border-[#E9E9EE]",
    primary: "bg-[#eaf5ef] text-[#267a50] border-[#267a50]/20",
    secondary: "bg-[#67bf9a]/20 text-[#267a50] border-[#67bf9a]/40",
    premium:
      "bg-gradient-to-r from-[#267a50]/15 to-[#67bf9a]/25 text-[#267a50] border-[#67bf9a]/40",
    success: "bg-[#22C55E]/10 text-[#16A34A] border-[#22C55E]/20",
    warning: "bg-[#F59E0B]/10 text-[#D97706] border-[#F59E0B]/20",
    danger: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border leading-none",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Clean vector HAIYO Premium Badge using a refined Crown icon.
 */
export function PremiumBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[#1d1d1d]/85 backdrop-blur-md text-white border border-white/15 shadow-sm",
        className
      )}
    >
      <Crown className="w-3.5 h-3.5 text-[#67bf9a]" />
      <span>Premium</span>
    </span>
  );
}

/**
 * InterestChip component using crisp Lucide vector icons instead of emoji characters.
 * Selected chip uses Primary background (#267a50).
 */
export interface InterestChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  slug?: string;
  emoji?: string;
  selected?: boolean;
  interactive?: boolean;
}

export function InterestChip({
  label,
  slug,
  selected = false,
  interactive = true,
  className,
  ...props
}: InterestChipProps) {
  const iconKey = slug ?? label;

  if (!interactive) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium bg-white/95 text-[#1d1d1d] border border-[#E9E9EE]",
          className
        )}
      >
        <InterestIcon
          slugOrName={iconKey}
          className="text-[#267a50]"
        />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[14px] font-semibold border transition-all duration-150 active:scale-[0.97] cursor-pointer select-none",
        selected
          ? "bg-[#267a50] text-white border-[#267a50] shadow-[0_4px_12px_rgba(38, 122, 80,0.25)]"
          : "bg-white text-[#1d1d1d] border-[#E9E9EE] hover:border-[#267a50]/50",
        className
      )}
      {...props}
    >
      <InterestIcon
        slugOrName={iconKey}
        className={selected ? "text-white" : "text-[#6F7078]"}
      />
      <span>{label}</span>
    </button>
  );
}
