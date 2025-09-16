import * as React from "react";
import { forwardRef } from "react";
import { Textarea } from "@/components/ui/textarea";

interface TextareaWithCounterProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  maxLength: number;
  rows?: number;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const TextareaWithCounter = forwardRef<
  HTMLTextAreaElement,
  TextareaWithCounterProps
>(
  (
    {
      value,
      onChange,
      maxLength,
      rows = 1,
      placeholder,
      className = "",
      onKeyDown,
    },
    ref
  ) => {
    return (
      <div className="relative">
        <Textarea
          ref={ref}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={onChange}
          className={`${className} pr-12 resize-none`}
          onKeyDown={onKeyDown}
        />
        <span className="absolute bottom-1 right-2 text-xs text-gray-400">
          {value.length}/{maxLength}
        </span>
      </div>
    );
  }
);

TextareaWithCounter.displayName = "TextareaWithCounter";
