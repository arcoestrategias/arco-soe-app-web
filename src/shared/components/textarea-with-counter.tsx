import * as React from "react";
import { forwardRef } from "react";
import { Textarea } from "@/components/ui/textarea";

interface TextareaWithCounterProps {
  value: string;
  // ✅ mantenemos onChange (evento) para compatibilidad (Priorities)
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  // ✅ NUEVO: callback directo con el string para quienes no quieren lidiar con eventos
  onValueChange?: (value: string) => void;
  maxLength: number;
  rows?: number;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const TextareaWithCounter = forwardRef<
  HTMLTextAreaElement,
  TextareaWithCounterProps
>(function TextareaWithCounter(
  {
    value,
    onChange,
    onValueChange, // ✅ nuevo
    maxLength,
    rows = 1,
    placeholder,
    className = "",
    onKeyDown,
  },
  ref
) {
  return (
    <div className="relative w-full">
      <Textarea
        ref={ref}
        value={typeof value === "string" ? value : ""} // 🔒 guard
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        onChange={(e) => {
          // compat: quien esperaba el evento lo sigue recibiendo
          onChange?.(e);
          // conveniencia: quien quiere el string, lo recibe aquí
          onValueChange?.(e.target.value);
        }}
        className={`${className} pr-12 resize-none`}
        onKeyDown={onKeyDown}
      />
      <span className="absolute bottom-1 right-2 text-xs text-gray-400">
        {value?.length ?? 0}/{maxLength}
      </span>
    </div>
  );
});

TextareaWithCounter.displayName = "TextareaWithCounter";
