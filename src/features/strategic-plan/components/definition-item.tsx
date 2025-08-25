"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit3 } from "lucide-react";

interface DefinitionItemProps {
  id: number;
  content: string;
  badgeColor: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (newContent: string) => void;
  onCancel: () => void;
  showBadge?: boolean;
  showEditIcon?: boolean;
}

export function DefinitionItem({
  id,
  content,
  badgeColor,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  showBadge = true,
  showEditIcon = true,
}: DefinitionItemProps) {
  const [text, setText] = useState(content);
  const remaining = 500 - text.length;
  const showWarning = remaining < 50;

  return (
    <div className="relative group w-full p-3 bg-white rounded-lg border border-gray-200 transition-all duration-200">
      {/* Badge (opcional) */}
      {showBadge !== false && (
        <div
          className={`absolute -top-2 -left-2 w-6 h-6 rounded-full ${badgeColor} text-white flex items-center justify-center text-xs font-medium shadow-sm`}
        >
          {id}
        </div>
      )}

      {isEditing ? (
        <div className="flex flex-col gap-1 w-full">
          <Input
            className="text-sm h-8 px-2"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 500))}
            placeholder="Editar..."
          />
          <div className="flex justify-between items-center w-full">
            <span
              className={`text-xs ${
                showWarning ? "text-red-500" : "text-gray-500"
              }`}
            >
              {remaining} caracteres restantes
            </span>
            <div className="flex gap-2 mt-1">
              <Button size="sm" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button size="sm" onClick={() => onSave(text)}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2 w-full">
          <p className="text-sm text-gray-700 leading-relaxed break-words flex-1">
            {content}
          </p>
          {showEditIcon && (
            <Button
              size="icon"
              variant="ghost"
              className="opacity-0 group-hover:opacity-100 transition"
              onClick={onEdit}
            >
              <Edit3 className="w-4 h-4 text-gray-400" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
