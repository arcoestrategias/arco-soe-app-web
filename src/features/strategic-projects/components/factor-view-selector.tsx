"use client";

import { LayoutGrid, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ViewMode = "cards" | "table";

export interface FactorViewSelectorProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function FactorViewSelector({ viewMode, onViewModeChange }: FactorViewSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
      <Button
        variant={viewMode === "cards" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("cards")}
        className={`h-7 px-2 ${
          viewMode === "cards"
            ? "bg-white text-gray-900 shadow-sm hover:bg-white"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
        Cards
      </Button>
      <Button
        variant={viewMode === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("table")}
        className={`h-7 px-2 ${
          viewMode === "table"
            ? "bg-white text-gray-900 shadow-sm hover:bg-white"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <Table2 className="h-3.5 w-3.5 mr-1.5" />
        Tabla
      </Button>
    </div>
  );
}

export function getStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "cards";
  const stored = localStorage.getItem("factorViewMode") as ViewMode | null;
  return stored === "table" ? "table" : "cards";
}