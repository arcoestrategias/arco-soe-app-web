"use client";

import * as React from "react";
import {
  useSensor,
  useSensors,
  PointerSensor,
  DndContext,
  DragEndEvent,
  closestCenter,
  type DraggableAttributes,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useState } from "react";
import {
  StrategicProjectStructureFactor as Factor,
  StrategicProjectStructureTask as Task,
} from "../types/strategicProjectStructure";
import { Button } from "@/components/ui/button";
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  Edit,
  Plus,
  Save,
  X,
  Trash2,
} from "lucide-react";
import { SortableTask } from "./sortable-task";
import { TextareaWithCounter } from "@/shared/components/textarea-with-counter";
import { ConfirmModal } from "@/shared/components/confirm-modal";
import { toast } from "sonner";

interface FactorRowProps {
  rowNumber: number;
  factor: Factor;
  isExpanded: boolean;
  isEditing: boolean;
  editingTaskId?: string | null;
  onToggleExpand: () => void;
  onEdit: () => void;
  onSave: (factor: Factor) => void;
  onCancel: () => void;
  onDelete: () => void;
  onAddTask: () => void;
  countCompletedTasks: () => number;
  hasItemInCreation?: () => boolean;
  isDragging?: boolean;
  onEditTask: (factorNumber: number, taskNumber: number) => void;
  onSaveTask: (factorNumber: number, task: Task) => void;
  onCancelTask: (
    factorNumber: number,
    taskNumber: number,
    isNew?: boolean
  ) => void;
  onDeleteTask: (factorNumber: number, taskNumber: number) => void;
  onReorderTasks: (factorNumber: number, newOrder: Task[]) => void;
  dragDisabled?: boolean;
  dragDisabledReason?: string;
  listeners: SyntheticListenerMap;
  attributes: DraggableAttributes;
}

export function FactorRow({
  rowNumber,
  factor,
  isExpanded,
  isEditing,
  editingTaskId,
  onToggleExpand,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onAddTask,
  countCompletedTasks,
  hasItemInCreation,
  isDragging = false,
  onEditTask,
  onSaveTask,
  onCancelTask,
  onDeleteTask,
  onReorderTasks,
  dragDisabled = false,
  dragDisabledReason = "",
  listeners,
  attributes,
}: FactorRowProps) {
  const [editedFactor, setEditedFactor] = useState<Factor>({ ...factor });
  const [showConfirm, setShowConfirm] = useState(false);

  // ✅ Hooks SIEMPRE en top-level, nunca dentro de condicionales
  const taskDnDSensors = useSensors(useSensor(PointerSensor));

  const handleChange = (field: keyof Factor, value: any) => {
    setEditedFactor({ ...editedFactor, [field]: value });
  };

  const handleSave = () => onSave(editedFactor);

  const handleDragEndTask = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const list = factor.tasks ?? [];
    const oldIndex = list.findIndex((t) => t.id === active.id);
    const newIndex = list.findIndex((t) => t.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(list, oldIndex, newIndex).map((t, i) => ({
        ...t,
        order: i + 1,
      }));
      onReorderTasks(rowNumber, reordered);
    }
  };

  const tareasTerminadas = countCompletedTasks();
  const totalTareas = (factor.tasks ?? []).length;

  const showBlocked = () => {
    toast.info(
      dragDisabledReason ||
        "No puedes reordenar mientras hay cambios sin guardar."
    );
  };

  // Handlers tipados correctamente (no hay casts peligrosos)
  const blockedMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    showBlocked();
  };
  const blockedPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    showBlocked();
  };
  const blockedTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    showBlocked();
  };

  // Props cuando está bloqueado
  const blockedProps: React.HTMLAttributes<HTMLDivElement> = {
    onMouseDown: blockedMouseDown,
    onPointerDown: blockedPointerDown,
    onTouchStart: blockedTouchStart,
  };

  // Props “sortable” (coaccionamos tipos de dnd-kit a HTMLAttributes)
  const sortableProps = (!dragDisabled
    ? { ...(listeners ?? {}), ...(attributes ?? {}) }
    : {}) as unknown as React.HTMLAttributes<HTMLDivElement>;

  return (
    <div
      className={`p-3 transition-all duration-200 ${
        isDragging ? "bg-blue-50" : "bg-white hover:bg-gray-50"
      }`}
    >
      {/* Fila del factor */}
      <div className="grid grid-cols-12 gap-2 items-center">
        {/* Modo edición de factor */}
        {isEditing ? (
          <>
            <div className="col-span-4 flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-3 py-2 ${
                  dragDisabled ? "cursor-not-allowed opacity-60" : "cursor-grab"
                }`}
                title={
                  dragDisabled
                    ? dragDisabledReason || "No puedes reordenar ahora"
                    : "Arrastra para reordenar"
                }
                {...(dragDisabled ? blockedProps : sortableProps)}
              >
                <GripVertical size={16} />
              </div>
              <button
                onClick={onToggleExpand}
                className="hover:text-gray-700 p-1 rounded hover:bg-gray-100"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">
                  Nombre
                </label>
                <TextareaWithCounter
                  value={editedFactor.name ?? ""}
                  onValueChange={(val) => handleChange("name", val)}
                  maxLength={150}
                />
              </div>
            </div>

            <div className="col-span-4">
              <label className="text-xs text-gray-500 mb-1 block">
                Resultado
              </label>
              <TextareaWithCounter
                value={editedFactor.result ?? ""}
                onValueChange={(val) => handleChange("result", val)}
                maxLength={300}
              />
            </div>

            <div className="col-span-2 text-xs text-gray-500 flex items-center">
              Tareas: {tareasTerminadas} / {totalTareas}
            </div>

            <div className="col-span-2 flex justify-end items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => onCancel()}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-green-600 hover:text-green-700"
                onClick={handleSave}
              >
                <Save className="h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        ) : (
          // Vista lectura
          <>
            <div className="col-span-4 flex items-center gap-2">
              <div
                className={`text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 ${
                  dragDisabled ? "cursor-not-allowed opacity-60" : "cursor-grab"
                }`}
                title={
                  dragDisabled
                    ? dragDisabledReason || "No puedes reordenar ahora"
                    : "Arrastra para reordenar"
                }
                {...(dragDisabled ? blockedProps : sortableProps)}
              >
                <GripVertical size={16} />
              </div>
              <button
                onClick={onToggleExpand}
                className="hover:text-gray-700 p-1 rounded hover:bg-gray-100"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              <span className="text-sm font-medium text-gray-800 truncate">
                {factor.name ?? ""}
              </span>
            </div>
            <div className="col-span-4">
              <span className="text-sm text-gray-600 line-clamp-2">
                {factor.result ?? ""}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Tareas: {tareasTerminadas} / {totalTareas}
              </span>
            </div>
            <div className="col-span-2 flex justify-end items-center gap-1">
              <Button
                onClick={onEdit}
                size="icon"
                variant="ghost"
                className="h-7 w-7"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                onClick={onAddTask}
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-blue-500 hover:bg-blue-50"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button
                onClick={() => setShowConfirm(true)}
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Tareas del factor */}
      {isExpanded && (factor.tasks?.length ?? 0) > 0 && (
        <div className="mt-2 pl-8 bg-gray-50 border-t border-gray-100">
          <DndContext
            sensors={taskDnDSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEndTask}
          >
            <SortableContext
              items={(factor.tasks ?? []).map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {(factor.tasks ?? []).map((task, idx) => (
                <SortableTask
                  key={task.id}
                  task={task}
                  isEditing={editingTaskId === task.id}
                  onEdit={() => onEditTask(rowNumber, idx + 1)}
                  onSave={(t) => onSaveTask(rowNumber, t)}
                  onCancel={() => onCancelTask(rowNumber, idx + 1, false)}
                  onDelete={() => onDeleteTask(rowNumber, idx + 1)}
                  dragDisabled={dragDisabled}
                  dragDisabledReason={dragDisabledReason}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Confirmación eliminar factor (inactivar) */}
      <ConfirmModal
        open={showConfirm}
        title="Eliminación de factor"
        message={
          (factor.tasks?.length ?? 0) > 0
            ? "Esto inactivará el factor y sus tareas relacionadas."
            : "¿Estás seguro de que deseas inactivar este factor?"
        }
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          onDelete();
          setShowConfirm(false);
        }}
        confirmText="Inactivar"
      >
        {(factor.tasks?.length ?? 0) > 0 && (
          <ul className="list-disc list-inside text-sm text-gray-700 max-h-32 overflow-auto pr-2">
            {(factor.tasks ?? []).map((t) => (
              <li key={t.id}>{t.name || "Sin nombre"}</li>
            ))}
          </ul>
        )}
      </ConfirmModal>
    </div>
  );
}
