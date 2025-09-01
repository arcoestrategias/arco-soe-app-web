"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit3 } from "lucide-react";

type DefinitionItemProps = {
  id: number;
  content: string;
  badgeColor: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (newContent: string) => void;
  onCancel: () => void;
  showBadge?: boolean;
  showEditIcon?: boolean;
  /** Límite de caracteres para edición inline (default 100) */
  maxLength?: number;
};

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
  maxLength = 100,
}: DefinitionItemProps) {
  const [value, setValue] = React.useState(content);

  // Rehidratamos el valor al entrar en modo edición o si cambia el contenido base
  React.useEffect(() => {
    if (isEditing) setValue(content ?? "");
  }, [isEditing, content]);

  const remaining = maxLength - value.length;

  return (
    <div className="relative group w-full p-3 bg-white rounded-lg border border-gray-200 transition-all duration-200">
      {/* Badge (opcional) */}
      {showBadge && (
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
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, maxLength))}
            placeholder="Editar..."
            maxLength={maxLength}
          />
          <div className="flex justify-between items-center w-full mt-1">
            <span
              className={`text-xs ${
                remaining <= 10 ? "text-red-500" : "text-gray-500"
              }`}
            >
              {value.length}/{maxLength}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => onSave(value.trim())}
                disabled={!value.trim()}
              >
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
              aria-label="Editar"
              title="Editar"
            >
              <Edit3 className="w-4 h-4 text-gray-400" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
