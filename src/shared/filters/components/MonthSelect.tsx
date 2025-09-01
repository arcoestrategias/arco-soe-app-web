// shared/filters/components/MonthSelect.tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import clsx from "clsx";

export function MonthSelect({
  value,
  onChange,
  disabled,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}) {
  const months = [
    { v: 1, n: "Ene" },
    { v: 2, n: "Feb" },
    { v: 3, n: "Mar" },
    { v: 4, n: "Abr" },
    { v: 5, n: "May" },
    { v: 6, n: "Jun" },
    { v: 7, n: "Jul" },
    { v: 8, n: "Ago" },
    { v: 9, n: "Sep" },
    { v: 10, n: "Oct" },
    { v: 11, n: "Nov" },
    { v: 12, n: "Dic" },
  ];

  return (
    <div className={clsx("space-y-1", className)}>
      <Select
        disabled={disabled}
        value={String(value)}
        onValueChange={(v) => onChange(Number(v))}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Mes" />
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m.v} value={String(m.v)}>
              {m.n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
