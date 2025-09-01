// shared/filters/components/YearSelect.tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import clsx from "clsx";

export function YearSelect({
  value,
  onChange,
  disabled,
  className,
  range = 2, // ±2 por defecto
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  className?: string;
  range?: number;
  label?: string;
}) {
  const current = new Date().getFullYear();
  const years = Array.from(
    { length: range * 2 + 1 },
    (_, i) => current - range + i
  );

  return (
    <div className={clsx("space-y-1", className)}>
      <Select
        disabled={disabled}
        value={String(value)}
        onValueChange={(v) => onChange(Number(v))}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Año" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
