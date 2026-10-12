import React, { useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-[14px] font-semibold text-[#1d1d1d]"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={Boolean(error)}
            className={cn(
              "w-full h-[50px] appearance-none rounded-[12px] bg-white pl-4 pr-10 text-[15px] text-[#1d1d1d] border transition-all duration-150 focus:outline-none cursor-pointer",
              error
                ? "border-[#EF4444] focus:border-[#EF4444] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.14)]"
                : "border-[#E9E9EE] focus:border-[#267a50] focus:shadow-[0_0_0_3px_rgba(38, 122, 80,0.16)]",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <ChevronDown className="w-4 h-4 text-[#6F7078] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {error && (
          <p role="alert" className="text-[12px] text-[#EF4444] font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";
