import React, { useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: React.ReactNode;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={checkboxId}
          className={cn(
            "inline-flex items-start gap-3 cursor-pointer select-none",
            className
          )}
        >
          <span className="relative flex items-center justify-center mt-0.5">
            <input
              ref={ref}
              id={checkboxId}
              type="checkbox"
              className="peer sr-only"
              {...props}
            />
            <span className="w-5 h-5 rounded-[6px] border border-[#E9E9EE] bg-white peer-checked:bg-[#267a50] peer-checked:border-[#267a50] peer-focus-visible:shadow-[0_0_0_3px_rgba(38, 122, 80,0.2)] transition-all flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 stroke-[3]" />
            </span>
          </span>
          <span className="flex flex-col">
            <span className="text-[14px] text-[#1d1d1d] font-medium leading-snug">
              {label}
            </span>
            {description && (
              <span className="text-[12px] text-[#6F7078] mt-0.5">
                {description}
              </span>
            )}
          </span>
        </label>
        {error && (
          <p role="alert" className="text-[12px] text-[#EF4444] font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: React.ReactNode;
  description?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const generatedId = useId();
    const radioId = id ?? generatedId;

    return (
      <label
        htmlFor={radioId}
        className={cn(
          "flex items-center gap-3 p-3.5 rounded-[14px] border border-[#E9E9EE] bg-white hover:border-[#267a50]/50 has-[:checked]:border-[#267a50] has-[:checked]:bg-[#eaf5ef]/60 cursor-pointer transition-all select-none",
          className
        )}
      >
        <input
          ref={ref}
          id={radioId}
          type="radio"
          className="peer sr-only"
          {...props}
        />
        <span className="w-5 h-5 rounded-full border-2 border-[#D1D1DB] peer-checked:border-[#267a50] flex items-center justify-center shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#267a50] scale-0 peer-checked:scale-100 transition-transform" />
        </span>
        <span className="flex flex-col">
          <span className="text-[14px] font-medium text-[#1d1d1d]">{label}</span>
          {description && (
            <span className="text-[12px] text-[#6F7078]">{description}</span>
          )}
        </span>
      </label>
    );
  }
);
Radio.displayName = "Radio";
