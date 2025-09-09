import { forwardRef } from "react";
import { Input } from "@/components/ui/input";

interface InputWithCounterProps {
  value: string;
  onChange: (val: string) => void;
  maxLength: number;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export const InputWithCounter = forwardRef<
  HTMLInputElement,
  InputWithCounterProps
>(
  (
    {
      value,
      onChange,
      maxLength,
      placeholder,
      className = "",
      onKeyDown,
      disabled = false,
    },
    ref
  ) => {
    return (
      <div className="relative">
        <Input
          ref={ref}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          className={`${className} pr-12`}
          onKeyDown={onKeyDown}
          disabled={disabled}
        />
        <span className="absolute bottom-1 right-2 text-xs text-gray-400">
          {value.length}/{maxLength}
        </span>
      </div>
    );
  }
);

InputWithCounter.displayName = "InputWithCounter";
