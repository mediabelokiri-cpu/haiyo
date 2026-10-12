import React from "react";
import { Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "premium";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        "bg-[#267a50] text-white hover:bg-[#1e6340] active:bg-[#1e6340] shadow-[0_4px_14px_rgba(38, 122, 80,0.28)]",
      secondary:
        "bg-white text-[#1d1d1d] border border-[#E9E9EE] hover:bg-[#f9f9fa] active:bg-[#F5F5FA]",
      danger:
        "bg-[#EF4444] text-white hover:bg-[#DC2626] active:bg-[#B91C1C]",
      ghost:
        "bg-transparent text-[#6F7078] hover:text-[#1d1d1d] hover:bg-black/5",
      premium:
        "bg-gradient-to-r from-[#267a50] to-[#67bf9a] text-white hover:opacity-95 shadow-[0_4px_16px_rgba(38, 122, 80,0.28)]",
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: "h-10 px-4 text-[14px]",
      md: "h-[50px] px-6 text-[15px]",
      lg: "h-[52px] px-7 text-[16px]",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(38, 122, 80,0.25)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span
            aria-hidden="true"
            className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
          />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);
Button.displayName = "Button";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "surface" | "primary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  label: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "surface", size = "md", label, children, type = "button", ...props }, ref) => {
    const variantStyles = {
      surface: "bg-white text-[#1d1d1d] border border-[#E9E9EE] hover:bg-[#f9f9fa] shadow-[0_4px_20px_rgba(0,0,0,0.06)]",
      primary: "bg-[#267a50] text-white hover:bg-[#1e6340] shadow-[0_8px_24px_rgba(38, 122, 80,0.28)]",
      ghost: "bg-transparent text-[#6F7078] hover:text-[#1d1d1d] hover:bg-black/5",
      danger: "bg-[#EF4444] text-white hover:bg-[#DC2626]",
    };

    const sizeStyles = {
      sm: "w-11 h-11",
      md: "w-12 h-12",
      lg: "w-[52px] h-[52px]",
    };

    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(38, 122, 80,0.25)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";

/**
 * Dedicated Discover Pass Button (48px compact circle, white, X icon).
 */
export function PassButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label="Pass profil ini"
      className={cn(
        "w-12 h-12 rounded-full bg-white border border-[#E9E9EE] text-[#1d1d1d] hover:bg-[#F7F7FA] hover:border-[#D5D5DE] shadow-[0_4px_14px_rgba(0,0,0,0.08)] inline-flex items-center justify-center transition-all duration-150 active:scale-[0.94] cursor-pointer disabled:opacity-50",
        className
      )}
      {...props}
    >
      <X className="w-5 h-5 stroke-[2.5]" />
    </button>
  );
}

/**
 * Dedicated Discover Like Button (52px compact circle, primary pink, Heart icon).
 */
export function LikeButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label="Sukai profil ini"
      className={cn(
        "w-[52px] h-[52px] rounded-full bg-[#267a50] hover:bg-[#1e6340] text-white shadow-[0_6px_18px_rgba(38, 122, 80,0.32)] inline-flex items-center justify-center transition-all duration-150 active:scale-[0.94] cursor-pointer disabled:opacity-50",
        className
      )}
      {...props}
    >
      <Heart className="w-6 h-6 fill-white stroke-white" />
    </button>
  );
}
