"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function LoginEmailField({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor="email"
        className="text-xs text-gray-700 nav-text-optimized"
      >
        Correo electrónico
      </Label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          id="email"
          type="email"
          placeholder="tu@empresa.com"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 h-12 focus:border-[#FF6B35] focus:ring-[#FF6B35] border-gray-200 font-system text-optimized"
          required
        />
      </div>
    </div>
  );
}
