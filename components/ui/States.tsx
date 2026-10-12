import React from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-[12px] bg-[#E9E9EE]/80",
        className
      )}
      {...props}
    />
  );
}

export function ProfileCardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat profil..."
      className="w-full max-w-[400px] mx-auto rounded-[24px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden p-4 space-y-4"
    >
      <Skeleton className="w-full aspect-[3/4] rounded-[20px]" />
      <div className="space-y-2.5 px-1">
        <Skeleton className="h-6 w-1/2 rounded-full" />
        <Skeleton className="h-4 w-1/3 rounded-full" />
        <Skeleton className="h-4 w-5/6 rounded-full" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-12 rounded-[20px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.06)]",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-[#eaf5ef] text-[#267a50] flex items-center justify-center mb-4">
        {icon ?? <Inbox className="w-7 h-7" />}
      </div>
      <h3 className="text-[18px] font-bold text-[#1d1d1d]">{title}</h3>
      <p className="text-[14px] text-[#6F7078] max-w-xs mt-1.5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-6">
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Oops, ada yang bermasalah.",
  description = "Coba lagi beberapa saat.",
  retryLabel = "Coba Lagi",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-12 rounded-[20px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.06)]",
        className
      )}
    >
      <div className="w-14 h-14 rounded-full bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h3 className="text-[18px] font-bold text-[#1d1d1d]">{title}</h3>
      <p className="text-[14px] text-[#6F7078] max-w-xs mt-1.5">
        {description}
      </p>
      {onRetry && (
        <div className="mt-6">
          <Button variant="secondary" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
