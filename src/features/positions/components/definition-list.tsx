// src/features/strategic-plans/components/definition-list.tsx
"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit3, GripVertical, Plus, X } from "lucide-react";
import { DefinitionItem } from "./definition-item";
import { toast } from "sonner";

export type DefinitionListItem = {
  id: number;
  content: string;
  metaId?: string;
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

  /** Si se provee, reemplaza el flujo de creación inline por una modal externa */
  onRequestCreate?: () => void;

  /** Si se provee, intercepta la eliminación para mostrar modal externa */
  onRequestDelete?: (uiIndex: number, item: DefinitionListItem) => void;

  /** Permisos */
  canEdit?: boolean;
  canDelete?: boolean;
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
  onRequestCreate,
  onRequestDelete,
  canEdit = true,
  canDelete = true,
}: Props) {
  const [localItems, setLocalItems] = useState<DefinitionListItem[]>([]);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newItemText, setNewItemText] = useState("");

  const [editingMetaId, setEditingMetaId] = useState<string | null>(null);

  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);

  const reindex = (arr: DefinitionListItem[]) =>
    arr.map((it, idx) => ({ ...it, id: idx + 1 }));

  useEffect(() => {
    setLocalItems(reindex(items));
    setEditingMetaId(null);
  }, [items, isEditing]);

  const hasReorderChanges = useMemo(() => {
    if (localItems.length !== items.length) return false;
    const orig = items.map((it) => it.metaId ?? `v-${it.id}`);
    const curr = localItems.map((it) => it.metaId ?? `v-${it.id}`);
    for (let i = 0; i < orig.length; i++) {
      if (orig[i] !== curr[i]) return true;
    }
    return false;
  }, [items, localItems]);

  // DnD
  const handleDragStart = (dragVisualId: number, e: React.DragEvent) => {
    if (!canEdit) return;
    e.dataTransfer.effectAllowed = "move";
    setDragId(dragVisualId);
  };

  const handleDragOver = (overId: number, e: React.DragEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    setDragOverItem(overId);
  };

  const handleDrop = (dropId: number) => {
    if (!canEdit) return;
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
    if (!canDelete || !canEdit) return;
    const item = localItems.find((it) => it.id === uiIndex);
    if (onRequestDelete && item) {
      onRequestDelete(uiIndex, item);
      return;
    }
    if (hasReorderChanges) {
      toast.warning("Guarda primero el orden para poder eliminar.");
      return;
    }
    actions?.remove?.(uiIndex);
    setLocalItems((prev) => reindex(prev.filter((it) => it.id !== uiIndex)));
  };

  // Crear
  const handleCreate = () => {
    if (!canEdit) return;
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

  // Abrir modal de crear (si está provista)
  const openCreate = () => {
    if (!canEdit) return;
    if (hasReorderChanges) {
      toast.warning(
        "Guarda primero el orden para poder crear nuevos elementos."
      );
      return;
    }
    if (onRequestCreate) {
      onRequestCreate();
      return;
    }
    setCreatingNew(true);
  };

  // Guardar orden
  const handleSaveAll = () => {
    if (!canEdit) return;
    if (!hasReorderChanges) return;
    actions?.reorder?.(localItems);
  };

  const startInlineEdit = (metaId?: string, fallbackId?: number) => {
    if (!canEdit) return;
    if (hasReorderChanges) {
      toast.warning("Guarda primero el orden para poder editar.");
      return;
    }
    setEditingMetaId(metaId ?? String(fallbackId));
  };

  const saveInlineEdit = (item: DefinitionListItem, newContent: string) => {
    if (!canEdit) return;
    const value = newContent.trim();
    if (!value) return;

    if (item.metaId && actions?.updateById) {
      actions.updateById(item.metaId, value);
    } else {
      actions?.update?.(item.id, value);
    }

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

  const deleteDisabled = hasReorderChanges || !canDelete || !canEdit;

  return (
    <div
      className={`relative group border shadow-sm rounded-xl transition-all duration-200 ${cardColor} ${cardBorderColor}`}
      onMouseEnter={() => onHover?.(sectionKey)}
      onMouseLeave={() => onHover?.(null)}
    >
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
          {onRequestCreate && canEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (hasReorderChanges) {
                  toast.warning(
                    "Guarda primero el orden para poder crear nuevos elementos."
                  );
                  return;
                }
                onRequestCreate();
              }}
            >
              <Plus className="w-4 h-4 mr-1" /> Agregar
            </Button>
          )}

          {!isEditing && canEdit && (
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
              {canEdit
                ? "Arrastra los elementos para reordenar"
                : "Edición deshabilitada"}
            </p>

            <div className="space-y-3">
              {localItems.map((item) => (
                <div
                  key={item.metaId ?? `row-${item.id}`}
                  draggable={canEdit}
                  onDragStart={(e) => handleDragStart(item.id, e)}
                  onDragOver={(e) => handleDragOver(item.id, e)}
                  onDrop={() => handleDrop(item.id)}
                  onDragLeave={() => setDragOverItem(null)}
                  className={`flex items-center gap-3 py-2 px-3 rounded-md border bg-white transition-all duration-150 ${
                    dragOverItem === item.id
                      ? "border-2 border-dashed border-primary"
                      : itemBorderColor
                  } ${!canEdit ? "opacity-60" : ""}`}
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
                      showEditIcon={canEdit}
                      onSave={(newContent) => saveInlineEdit(item, newContent)}
                      onCancel={() => setEditingMetaId(null)}
                    />
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={deleteDisabled}
                    className={`flex-shrink-0 ${
                      deleteDisabled
                        ? "text-gray-300 hover:text-gray-300 cursor-not-allowed"
                        : "text-red-500 hover:text-red-600"
                    }`}
                    onClick={() =>
                      deleteDisabled ? undefined : handleDelete(item.id)
                    }
                    title={
                      !canDelete
                        ? "No tienes permiso para eliminar."
                        : hasReorderChanges
                        ? "Guarda primero el orden para poder crear, editar o eliminar."
                        : "Eliminar"
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Si onRequestCreate existe, ocultamos el input inline */}
            {creatingNew && !onRequestCreate ? (
              <div className="space-y-2 mt-4">
                <Input
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Nuevo elemento..."
                  maxLength={100}
                  disabled={!canEdit || hasReorderChanges || isReordering}
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
                      !canEdit ||
                      isReordering ||
                      hasReorderChanges ||
                      newItemText.trim().length === 0
                    }
                    title={
                      !canEdit
                        ? "No tienes permiso para crear."
                        : hasReorderChanges
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
                onClick={() => {
                  if (hasReorderChanges) {
                    toast.warning(
                      "Guarda primero el orden para poder crear nuevos elementos."
                    );
                    return;
                  }
                  if (!canEdit) return;
                  if (onRequestCreate) {
                    onRequestCreate();
                  } else {
                    setCreatingNew(true);
                  }
                }}
                disabled={!canEdit || isReordering}
                className={hasReorderChanges ? "opacity-60 cursor-pointer" : ""}
                title={!canEdit ? "No tienes permiso para crear." : undefined}
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
                disabled={!canEdit || !hasReorderChanges || isReordering}
                title={
                  !canEdit ? "No tienes permiso para reordenar." : undefined
                }
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
