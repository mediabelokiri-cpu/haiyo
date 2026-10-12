import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      showCount = false,
      maxLength,
      value,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {(label || (showCount && maxLength)) && (
          <div className="flex items-center justify-between">
            {label ? (
              <label
                htmlFor={textareaId}
                className="text-[14px] font-semibold text-[#1d1d1d]"
              >
                {label}
              </label>
            ) : (
              <span />
            )}
            {showCount && maxLength && (
              <span className="text-[12px] text-[#6F7078]">
                {currentLength} / {maxLength}
              </span>
            )}
          </div>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          maxLength={maxLength}
          value={value}
          aria-invalid={Boolean(error)}
          className={cn(
            "w-full min-h-[120px] rounded-[14px] bg-white p-4 text-[15px] text-[#1d1d1d] placeholder:text-[#A0A0A8] border transition-all duration-150 focus:outline-none resize-y",
            error
              ? "border-[#EF4444] focus:border-[#EF4444] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.14)]"
              : "border-[#E9E9EE] focus:border-[#267a50] focus:shadow-[0_0_0_3px_rgba(38, 122, 80,0.16)]",
            className
          )}
          {...props}
        />

        {error ? (
          <p role="alert" className="text-[12px] text-[#EF4444] font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-[12px] text-[#6F7078]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
