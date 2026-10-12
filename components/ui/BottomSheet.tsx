"use client";

import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * BottomSheet component per UI/UX Section 63 & 64:
 * - Rounded top 24px on mobile (centered modal on desktop)
 * - Drag indicator
 * - Max height ~85vh
 * - White surface
 */
export function BottomSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: BottomSheetProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);

    const supportsClosedBy =
      typeof HTMLDialogElement !== "undefined" &&
      "closedBy" in HTMLDialogElement.prototype;

    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;

      if (isDialogContent) return;
      dialog.close();
    };

    if (!supportsClosedBy) {
      dialog.addEventListener("click", handleBackdropClick);
    }

    return () => {
      dialog.removeEventListener("close", handleClose);
      if (!supportsClosedBy) {
        dialog.removeEventListener("click", handleBackdropClick);
      }
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby={titleId}
      className={cn(
        "m-0 mt-auto md:m-auto w-full max-w-full md:max-w-lg max-h-[85dvh] rounded-t-[24px] md:rounded-[24px] bg-white p-0 text-[#1d1d1d] shadow-[0_8px_24px_rgba(0,0,0,0.12)] border-t md:border border-[#E9E9EE] focus:outline-none overflow-hidden",
        className
      )}
    >
      <div className="flex flex-col max-h-[85dvh]">
        {/* Mobile Drag Indicator */}
        <div className="pt-3 pb-1 flex justify-center md:hidden">
          <span
            aria-hidden="true"
            className="w-10 h-1.5 rounded-full bg-[#E9E9EE]"
          />
        </div>

        {/* Sheet Header */}
        <div className="px-5 pt-3 pb-4 border-b border-[#E9E9EE] flex items-center justify-between gap-3">
          <div>
            <h2
              id={titleId}
              className="text-[18px] font-semibold text-[#1d1d1d]"
            >
              {title}
            </h2>
            {description && (
              <p className="text-[13px] text-[#6F7078] mt-0.5">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Tutup panel"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#6F7078] hover:text-[#1d1d1d] hover:bg-[#f9f9fa] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Sheet Content */}
        <div className="p-5 overflow-y-auto pb-safe">{children}</div>
      </div>
    </dialog>
  );
}
