"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit3, GripVertical, Plus, X } from "lucide-react";
import { DefinitionItem } from "./definition-item";
import { toast } from "sonner";

export type DefinitionListItem = {
  id: number; // índice visual (1..N)
  content: string; // texto visible
  metaId?: string; // UUID real del ítem (estable)
  isActive?: boolean;
};

export type DefinitionListActions = {
  create?: (name: string) => void | Promise<void>;
  updateById?: (id: string, name: string) => void | Promise<void>;
  update?: (uiIndex: number, name: string) => void | Promise<void>;
  remove?: (uiIndex: number) => void | Promise<void>;
  reorder?: (items: DefinitionListItem[]) => void | Promise<void>;
};

type Props = {
  sectionKey: string;
  title: string;

  items: DefinitionListItem[];

  hovered?: boolean;
  isEditing?: boolean;
  onHover?: (key: string | null) => void;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;

  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  iconBg?: string;
  cardColor?: string;
  cardBorderColor?: string;
  itemColor?: string;
  itemBorderColor?: string;
  badgeColor?: string;

  actions?: DefinitionListActions;

  /** Deshabilita "Guardar Orden" mientras corre la mutation de reorder */
  isReordering?: boolean;
  maxLengthCharacter: number;
};

export function DefinitionList({
  sectionKey,
  title,
  items,
  hovered,
  isEditing,
  onHover,
  onStartEdit,
  onCancelEdit,
  icon: Icon,
  iconColor = "text-violet-600",
  iconBg = "bg-violet-100",
  cardColor = "bg-gray-50",
  cardBorderColor = "border border-gray-200",
  itemColor = "bg-white",
  itemBorderColor = "border border-gray-200",
  badgeColor = "bg-violet-500",
  actions,
  isReordering = false,
  maxLengthCharacter = 100,
}: Props) {
  const [localItems, setLocalItems] = useState<DefinitionListItem[]>([]);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newItemText, setNewItemText] = useState("");

  // Editar por metaId estable
  const [editingMetaId, setEditingMetaId] = useState<string | null>(null);

  // DnD
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);

  // Reindex sin perder metaId/isActive
  const reindex = (arr: DefinitionListItem[]) =>
    arr.map((it, idx) => ({ ...it, id: idx + 1 }));

  // Sincroniza items del parent -> local
  useEffect(() => {
    setLocalItems(reindex(items));
    setEditingMetaId(null);
  }, [items, isEditing]);

  // --- Detección de cambios de orden ---
  const hasReorderChanges = useMemo(() => {
    if (localItems.length !== items.length) return false;
    const orig = items.map((it) => it.metaId ?? `v-${it.id}`);
    const curr = localItems.map((it) => it.metaId ?? `v-${it.id}`);
    for (let i = 0; i < orig.length; i++) {
      if (orig[i] !== curr[i]) return true;
    }
    return false;
  }, [items, localItems]);

  // Drag & Drop
  const handleDragStart = (dragVisualId: number, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    setDragId(dragVisualId);
  };

  const handleDragOver = (overId: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverItem(overId);
  };

  const handleDrop = (dropId: number) => {
    setDragOverItem(null);
    if (dragId == null) return;

    const fromIdx = localItems.findIndex((it) => it.id === dragId);
    const toIdx = localItems.findIndex((it) => it.id === dropId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;

    const next = [...localItems];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setLocalItems(reindex(next));
  };

  // Eliminar (inactivar)
  const handleDelete = (uiIndex: number) => {
    if (hasReorderChanges) {
      toast.warning("Guarda primero el orden para poder eliminar.");
      return;
    }
    actions?.remove?.(uiIndex);
    setLocalItems((prev) => reindex(prev.filter((it) => it.id !== uiIndex)));
  };

  // Crear
  const handleCreate = () => {
    if (hasReorderChanges) {
      toast.warning(
        "Guarda primero el orden para poder crear nuevos elementos."
      );
      return;
    }
    const name = newItemText.trim();
    if (!name) return;
    actions?.create?.(name);
    setCreatingNew(false);
    setNewItemText("");
    setLocalItems((prev) =>
      reindex([...prev, { id: prev.length + 1, content: name }])
    );
  };

  // Abrir modal de crear (bloquea si hay cambios de orden)
  const openCreate = () => {
    if (hasReorderChanges) {
      toast.warning(
        "Guarda primero el orden para poder crear nuevos elementos."
      );
      return;
    }
    setCreatingNew(true);
  };

  // Guardar orden
  const handleSaveAll = () => {
    if (!hasReorderChanges) return; // seguridad
    actions?.reorder?.(localItems);
  };

  // Editar un item
  const startInlineEdit = (metaId?: string, fallbackId?: number) => {
    if (hasReorderChanges) {
      toast.warning("Guarda primero el orden para poder editar.");
      return;
    }
    setEditingMetaId(metaId ?? String(fallbackId));
  };

  const saveInlineEdit = (item: DefinitionListItem, newContent: string) => {
    const value = newContent.trim();
    if (!value) return;

    if (item.metaId && actions?.updateById) {
      actions.updateById(item.metaId, value);
    } else {
      actions?.update?.(item.id, value);
    }

    // Optimista: actualiza local por metaId estable
    setLocalItems((prev) =>
      prev.map((i) =>
        i.metaId && i.metaId === item.metaId
          ? { ...i, content: value }
          : i.id === item.id && !item.metaId
          ? { ...i, content: value }
          : i
      )
    );
    setEditingMetaId(null);
  };

  return (
    <div
      className={`relative group border shadow-sm rounded-xl transition-all duration-200 ${cardColor} ${cardBorderColor}`}
      onMouseEnter={() => onHover?.(sectionKey)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Encabezado */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center">
          {Icon ? (
            <div className={`p-2 rounded-lg ${iconBg} mr-3`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
          ) : null}
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>

        <div className="flex gap-2 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isEditing && (
            <Button size="icon" variant="ghost" onClick={onStartEdit}>
              <Edit3 className="w-4 h-4 text-gray-500" />
            </Button>
          )}
        </div>
      </div>

      <div className="px-6 py-6 space-y-3">
        {isEditing ? (
          <>
            <p className="text-sm text-gray-600 mb-2">
              Arrastra los elementos para reordenar
            </p>

            <div className="space-y-3">
              {localItems.map((item) => (
                <div
                  key={item.metaId ?? `row-${item.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(item.id, e)}
                  onDragOver={(e) => handleDragOver(item.id, e)}
                  onDrop={() => handleDrop(item.id)}
                  onDragLeave={() => setDragOverItem(null)}
                  className={`flex items-center gap-3 py-2 px-3 rounded-md border bg-white transition-all duration-150 ${
                    dragOverItem === item.id
                      ? "border-2 border-dashed border-primary"
                      : itemBorderColor
                  }`}
                >
                  <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div
                    className={`w-6 h-6 rounded-full ${badgeColor} text-white text-xs font-medium flex items-center justify-center shadow-sm flex-shrink-0`}
                  >
                    {item.id}
                  </div>

                  <div className="flex-1">
                    <DefinitionItem
                      id={item.id}
                      content={item.content}
                      maxLength={maxLengthCharacter}
                      badgeColor={badgeColor}
                      showBadge={false}
                      isEditing={editingMetaId === item.metaId}
                      onEdit={() => startInlineEdit(item.metaId, item.id)}
                      showEditIcon={true}
                      onSave={(newContent) => saveInlineEdit(item, newContent)}
                      onCancel={() => setEditingMetaId(null)}
                    />
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    className={`flex-shrink-0 ${
                      hasReorderChanges
                        ? "text-gray-300 hover:text-gray-300 cursor-not-allowed"
                        : "text-red-500 hover:text-red-600"
                    }`}
                    onClick={() => handleDelete(item.id)}
                    title={
                      hasReorderChanges
                        ? "Guarda primero el orden para poder crear, editar o eliminar."
                        : "Eliminar"
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {creatingNew ? (
              <div className="space-y-2 mt-4">
                <Input
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Nuevo elemento..."
                  maxLength={100}
                  disabled={hasReorderChanges || isReordering}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCreatingNew(false)}
                    disabled={isReordering}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={
                      isReordering ||
                      hasReorderChanges ||
                      newItemText.trim().length === 0
                    }
                    title={
                      hasReorderChanges
                        ? "Guarda primero el orden para poder crear."
                        : undefined
                    }
                  >
                    Crear
                  </Button>
                </div>
                {hasReorderChanges && (
                  <p className="text-xs text-muted-foreground">
                    Guarda el orden para poder crear nuevos elementos.
                  </p>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={openCreate}
                disabled={isReordering}
                className={hasReorderChanges ? "opacity-60 cursor-pointer" : ""}
              >
                <Plus className="w-4 h-4 mr-1" /> Agregar nuevo
              </Button>
            )}

            <div className="flex justify-end mt-4 gap-2">
              <Button
                variant="outline"
                onClick={onCancelEdit}
                disabled={isReordering}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveAll}
                disabled={!hasReorderChanges || isReordering}
              >
                {isReordering ? "Guardando…" : "Guardar Orden"}
              </Button>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {localItems.map((item) => (
              <DefinitionItem
                key={item.metaId ?? `row-${item.id}`}
                id={item.id}
                content={item.content}
                badgeColor={badgeColor}
                isEditing={false}
                onEdit={() => {}}
                showEditIcon={false}
                onSave={() => {}}
                onCancel={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
