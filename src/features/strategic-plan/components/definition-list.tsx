"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GripVertical, Edit3, Plus, X } from "lucide-react";
import { DefinitionItem } from "./definition-item";
import { Input } from "@/components/ui/input";

interface ListItem {
  id: number;
  content: string;
}

interface DefinitionListProps {
  sectionKey: string;
  title: string;
  items: ListItem[];
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  cardColor: string;
  cardBorderColor: string;
  itemColor: string;
  itemBorderColor: string;
  badgeColor: string;
  hovered: boolean;
  isEditing: boolean;
  onHover: (key: string | null) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (items: ListItem[]) => void;
}

export function DefinitionList({
  sectionKey,
  title,
  items,
  icon: Icon,
  iconColor,
  iconBg,
  cardColor,
  cardBorderColor,
  itemColor,
  itemBorderColor,
  badgeColor,
  hovered,
  isEditing,
  onHover,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
}: DefinitionListProps) {
  const [localItems, setLocalItems] = useState(items);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  const handleDragStart = (id: number, e: React.DragEvent) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (id: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverItem(id);
  };

  const handleDrop = (targetId: number) => {
    if (draggedItem == null || draggedItem === targetId) return;
    const draggedIndex = localItems.findIndex((i) => i.id === draggedItem);
    const targetIndex = localItems.findIndex((i) => i.id === targetId);

    const reordered = [...localItems];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    const renumbered = reordered.map((item, idx) => ({ ...item, id: idx + 1 }));
    setLocalItems(renumbered);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDelete = (id: number) => {
    const updated = localItems.filter((i) => i.id !== id);
    setLocalItems(updated.map((item, idx) => ({ ...item, id: idx + 1 })));
  };

  const handleSaveAll = () => {
    onSaveEdit(localItems);
  };

  const handleCreate = () => {
    const newId = Math.max(0, ...localItems.map((i) => i.id)) + 1;
    const newItem = { id: newId, content: newItemText };
    const updated = [...localItems, newItem];
    setLocalItems(updated);
    setNewItemText("");
    setCreatingNew(false);
  };

  return (
    <div
      className={`relative group border shadow-sm rounded-xl transition-all duration-200 ${cardColor} ${cardBorderColor}`}
      onMouseEnter={() => onHover(sectionKey)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Encabezado */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${iconBg} mr-3`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>

        <div className="flex gap-2 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isEditing && (
            <>
              <Button size="icon" variant="ghost" onClick={onStartEdit}>
                <Edit3 className="w-4 h-4 text-gray-500" />
              </Button>
            </>
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
                  key={item.id}
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
                      badgeColor={badgeColor}
                      showBadge={false}
                      isEditing={editingItemId === item.id}
                      onEdit={() => setEditingItemId(item.id)}
                      showEditIcon={true}
                      onSave={(newContent) => {
                        const updated = localItems.map((i) =>
                          i.id === item.id ? { ...i, content: newContent } : i
                        );
                        setLocalItems(updated);
                        setEditingItemId(null);
                      }}
                      onCancel={() => setEditingItemId(null)}
                    />
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 flex-shrink-0"
                    onClick={() => handleDelete(item.id)}
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
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCreatingNew(false)}
                  >
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleCreate}>
                    Crear
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreatingNew(true)}
              >
                <Plus className="w-4 h-4 mr-1" /> Agregar nuevo
              </Button>
            )}

            <div className="flex justify-end mt-4 gap-2">
              <Button variant="outline" onClick={onCancelEdit}>
                Cancelar
              </Button>
              <Button onClick={handleSaveAll}>Guardar Orden</Button>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {localItems.map((item) => (
              <DefinitionItem
                key={item.id}
                id={item.id}
                content={item.content}
                badgeColor={badgeColor}
                isEditing={false}
                onEdit={() => {}}
                showEditIcon={false}
                onSave={(newContent) => {
                  const updated = localItems.map((i) =>
                    i.id === item.id ? { ...i, content: newContent } : i
                  );
                  setLocalItems(updated);
                  setEditingItemId(null);
                }}
                onCancel={() => setEditingItemId(null)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
