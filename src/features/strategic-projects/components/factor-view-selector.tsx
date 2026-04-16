"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ViewMode = "cards" | "table";

const STORAGE_KEY = "factorViewMode";

export function FactorViewSelector() {
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
    if (stored === "cards" || stored === "table") {
      setViewMode(stored);
    }
  }, []);

  const handleChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
      <Button
        variant={viewMode === "cards" ? "default" : "ghost"}
        size="sm"
        onClick={() => handleChange("cards")}
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
        onClick={() => handleChange("table")}
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
  const stored = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
  return stored === "table" ? "table" : "cards";
}
