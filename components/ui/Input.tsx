import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightElement,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[14px] font-semibold text-[#1d1d1d]"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-4 text-[#6F7078] pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              "w-full h-[50px] rounded-[12px] bg-white px-4 text-[15px] text-[#1d1d1d] placeholder:text-[#A0A0A8] border transition-all duration-150 focus:outline-none",
              leftIcon ? "pl-11" : "",
              rightElement ? "pr-11" : "",
              error
                ? "border-[#EF4444] focus:border-[#EF4444] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.14)]"
                : "border-[#E9E9EE] focus:border-[#267a50] focus:shadow-[0_0_0_3px_rgba(38, 122, 80,0.16)]",
              "disabled:bg-[#F5F5FA] disabled:text-[#6F7078] disabled:cursor-not-allowed",
              className
            )}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {error ? (
          <p id={errorId} role="alert" className="text-[12px] text-[#EF4444] font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-[12px] text-[#6F7078]">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface RadiusSliderProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  helperText?: string;
  className?: string;
}

/**
 * Interactive Draggable Radius Range Slider (0 km – 500 km)
 */
export function RadiusSlider({
  label = "Radius Lokasi",
  value,
  min = 0,
  max = 500,
  step = 1,
  onChange,
  helperText,
  className,
}: RadiusSliderProps) {
  const sliderId = useId();
  const clampedValue = Math.min(max, Math.max(min, value));
  const percentage = ((clampedValue - min) / (max - min)) * 100;

  return (
    <div className={cn("w-full flex flex-col gap-2.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={sliderId}
          className="text-[14px] font-semibold text-[#1d1d1d]"
        >
          {label}
        </label>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#eaf5ef] border border-[#267a50]/25 text-[13px] font-bold text-[#267a50] tabular-nums">
          {clampedValue} km
        </span>
      </div>

      <div className="relative flex items-center py-1">
        <input
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={clampedValue}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            background: `linear-gradient(to right, #267a50 0%, #267a50 ${percentage}%, #E9E9EE ${percentage}%, #E9E9EE 100%)`,
          }}
          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#267a50] focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[2.5px] [&::-webkit-slider-thumb]:border-[#267a50] [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(38, 122, 80,0.35)] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:active:scale-110 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-[2.5px] [&::-moz-range-thumb]:border-[#267a50] [&::-moz-range-thumb]:shadow-[0_2px_8px_rgba(38, 122, 80,0.35)]"
        />
      </div>

      <div className="flex items-center justify-between text-[11px] font-medium text-[#6F7078] px-0.5">
        {[0, 100, 250, 500].map((mark) => (
          <button
            key={mark}
            type="button"
            onClick={() => onChange(mark)}
            className={cn(
              "hover:text-[#267a50] transition-colors cursor-pointer",
              clampedValue === mark && "text-[#267a50] font-bold"
            )}
          >
            {mark} km
          </button>
        ))}
      </div>

      {helperText && (
        <p className="text-[12px] text-[#6F7078]">{helperText}</p>
      )}
    </div>
  );
}

