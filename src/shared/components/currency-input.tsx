"use client";

import { useEffect, useState, forwardRef, RefObject } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/shared/utils/formatCurrency";

interface CurrencyInputProps {
  value: number;
  onChange: (val: number) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
  nextRef?: RefObject<HTMLElement>;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    { value, onChange, onKeyDown, className, placeholder = "$0.00", nextRef },
    ref
  ) => {
    const [rawDigits, setRawDigits] = useState(() =>
      Math.round(value * 100).toString()
    );

    useEffect(() => {
      const newRaw = Math.round(value * 100).toString();
      if (newRaw !== rawDigits) setRawDigits(newRaw);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digitsOnly = e.target.value.replace(/\D/g, "");
      if (digitsOnly.length > 12) return;
      const numericValue = parseFloat(
        (parseInt(digitsOnly || "0") / 100).toFixed(2)
      );
      setRawDigits(digitsOnly);
      onChange(numericValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && nextRef?.current) {
        e.preventDefault();
        nextRef.current.focus();
      }
      onKeyDown?.(e);
    };

    const formattedValue = formatCurrency(parseInt(rawDigits || "0") / 100);

    return (
      <Input
        ref={ref}
        value={formattedValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={`h-8 text-sm text-left ${className ?? ""}`}
        inputMode="numeric"
        placeholder={placeholder}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
