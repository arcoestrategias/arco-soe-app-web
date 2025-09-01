"use client";

import { useState } from "react";

interface TooltipTextoProps {
  texto: string;
  className?: string;
  children: React.ReactNode;
}

export function TooltipTexto({
  texto,
  className = "",
  children,
}: TooltipTextoProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs">
          <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-lg">
            <div className="break-words">{texto}</div>
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
}
