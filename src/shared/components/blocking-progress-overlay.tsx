"use client";

import React from "react";

export function BlockingProgressOverlay({
  open,
  label = "Procesando…",
  progress = 0,
}: {
  open: boolean;
  label?: string;
  progress?: number;
}) {
  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm"
      role="alert"
      aria-busy="true"
    >
      <div className="w-[420px] max-w-[90vw] rounded-2xl shadow-lg border bg-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-2 w-2 rounded-full bg-orange-600 animate-pulse" />
          <span className="text-sm font-medium text-gray-800">{label}</span>
        </div>

        <div className="h-2 w-full rounded bg-gray-200 overflow-hidden">
          <div
            className="h-2 bg-orange-600 transition-all duration-150"
            style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
          />
        </div>

        <div className="text-right mt-2 text-xs text-gray-500">
          {Math.max(0, Math.min(Math.round(progress), 100))}%
        </div>
      </div>
    </div>
  );
}
