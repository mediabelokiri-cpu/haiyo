"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { CheckCircle2, AlertCircle, Heart, Users, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { initPwaInstallListener } from "@/lib/pwa-install";

export type ToastVariant = "success" | "error" | "like" | "match" | "info";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (msg: Omit<ToastMessage, "id">) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    initPwaInstallListener();
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (msg: Omit<ToastMessage, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { ...msg, id }]);
      setTimeout(() => {
        dismissToast(id);
      }, 3600);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ toast, dismissToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed top-4 right-4 left-4 md:left-auto md:w-96 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((item) => {
          const variant = item.variant ?? "success";
          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                "pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-[16px] bg-white border shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-200",
                variant === "error" ? "border-[#EF4444]/30" : "border-[#E9E9EE]"
              )}
            >
              <span className="shrink-0">
                {variant === "success" && (
                  <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                )}
                {variant === "error" && (
                  <AlertCircle className="w-5 h-5 text-[#EF4444]" />
                )}
                {variant === "like" && (
                  <Heart className="w-5 h-5 text-[#267a50] fill-[#267a50]" />
                )}
                {variant === "match" && (
                  <Users className="w-5 h-5 text-[#67bf9a]" />
                )}
                {variant === "info" && (
                  <Info className="w-5 h-5 text-[#267a50]" />
                )}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#1d1d1d] truncate">
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-[12px] text-[#6F7078] mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => dismissToast(item.id)}
                aria-label="Tutup notifikasi"
                className="p-1 rounded-full text-[#6F7078] hover:text-[#1d1d1d] hover:bg-[#f9f9fa] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
