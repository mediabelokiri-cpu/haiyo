"use client";

import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  hideCloseButton?: boolean;
}

/**
 * Accessible Modal component using native <dialog closedby="any"> + showModal()
 * and mandatory bounding-rect fallback for browsers without closedBy support.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  hideCloseButton = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const descId = useId();

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

    const handleClose = () => {
      onClose();
    };

    dialog.addEventListener("close", handleClose);

    // Fallback for browsers without native closedby="any" support (e.g., Safari)
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
      aria-describedby={description ? descId : undefined}
      className={cn(
        "m-auto w-[calc(100%-32px)] max-w-md rounded-[20px] bg-white p-6 text-[#1d1d1d] shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-[#E9E9EE] focus:outline-none open:animate-in open:fade-in open:zoom-in-95",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id={titleId} className="text-[18px] font-semibold text-[#1d1d1d]">
            {title}
          </h2>
          {description && (
            <p id={descId} className="text-[14px] text-[#6F7078] mt-1">
              {description}
            </p>
          )}
        </div>

        {!hideCloseButton && (
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Tutup modal"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#6F7078] hover:text-[#1d1d1d] hover:bg-[#f9f9fa] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="mt-5">{children}</div>
    </dialog>
  );
}
