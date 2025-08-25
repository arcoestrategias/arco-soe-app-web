"use client";

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
import { useRef, useState } from "react";
import { Factor, Task } from "../types/types";
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

interface FactorRowProps {
  factor: Factor;
  onToggleExpand: () => void;
  onEdit: () => void;
  onSave: (factor: Factor) => void;
  onCancel: () => void;
  onDelete: () => void;
  onAddTask: () => void;
  countCompletedTasks: () => number;
  hasItemInCreation?: () => boolean;
  isDragging?: boolean;
  onEditTask: (factorId: number, taskId: number) => void;
  onSaveTask: (factorId: number, task: Task) => void;
  onCancelTask: (factorId: number, taskId: number, isNew?: boolean) => void;
  onDeleteTask: (factorId: number, taskId: number) => void;
  onReorderTasks: (factorId: number, newOrder: Task[]) => void;
  listeners: SyntheticListenerMap;
  attributes: DraggableAttributes;
}

export function FactorRow({
  factor,
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
  listeners,
  attributes,
}: FactorRowProps) {
  const [editedFactor, setEditedFactor] = useState<Factor>({ ...factor });
  const [showConfirm, setShowConfirm] = useState(false);
  const resultadosRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (field: keyof Factor, value: string) => {
    setEditedFactor({ ...editedFactor, [field]: value });
  };

  const handleSave = () => {
    onSave(editedFactor);
  };

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEndTask = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = factor.tareas.findIndex((t) => t.id === active.id);
    const newIndex = factor.tareas.findIndex((t) => t.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(factor.tareas, oldIndex, newIndex).map(
        (t, i) => ({
          ...t,
          orden: i + 1,
        })
      );
      onReorderTasks(factor.id, reordered);
    }
  };

  const tareasTerminadas = countCompletedTasks();
  const totalTareas = factor.tareas.length;

  return (
    <div
      className={`p-3 transition-all duration-200 ${
        isDragging ? "bg-blue-50" : "bg-white hover:bg-gray-50"
      }`}
    >
      <div className="grid grid-cols-12 gap-2 items-center">
        {factor.enEdicion ? (
          <>
            <div className="col-span-4 flex items-center gap-2">
              <GripVertical size={16} className="text-gray-400" />
              <TextareaWithCounter
                value={editedFactor.descripcion}
                onChange={(val) => handleChange("descripcion", val)}
                maxLength={120}
                placeholder="Describa el factor clave de éxito"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    resultadosRef.current?.focus();
                  }
                }}
                rows={1}
              />
            </div>
            <div className="col-span-4">
              <TextareaWithCounter
                ref={resultadosRef}
                value={editedFactor.resultado}
                onChange={(val) => handleChange("resultado", val)}
                maxLength={300}
                placeholder="Resultado (entregable)"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                rows={1}
              />
            </div>
            <div className="col-span-2 text-xs text-gray-500">N/A</div>
            <div className="col-span-2 flex justify-end gap-1">
              <Button
                onClick={onCancel}
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-red-500 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSave}
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-green-500 hover:bg-green-50"
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="col-span-4 flex items-center gap-2">
              <div
                className="cursor-grab text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                {...listeners}
                {...attributes}
              >
                <GripVertical size={16} />
              </div>
              <button
                onClick={onToggleExpand}
                className="hover:text-gray-700 p-1 rounded hover:bg-gray-100"
              >
                {factor.expandido ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              <span className="text-sm font-medium text-gray-800 truncate">
                {factor.descripcion}
              </span>
            </div>
            <div className="col-span-4">
              <span className="text-sm text-gray-600 line-clamp-2">
                {factor.resultado}
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
                className="h-7 w-7 text-gray-500 hover:bg-gray-100"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                onClick={onAddTask}
                size="icon"
                variant="ghost"
                disabled={hasItemInCreation?.()}
                className="h-7 w-7 text-blue-500 hover:bg-blue-50 disabled:opacity-50"
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
      {factor.expandido && factor.tareas.length > 0 && (
        <div className="mt-2 pl-8 bg-gray-50 border-t border-gray-100">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEndTask}
          >
            <SortableContext
              items={factor.tareas.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {factor.tareas.map((task) => (
                <SortableTask
                  key={task.id}
                  task={task}
                  onEdit={() => onEditTask(factor.id, task.id)}
                  onSave={(t) => onSaveTask(factor.id, t)}
                  onCancel={() =>
                    onCancelTask(factor.id, task.id, task.esNuevo)
                  }
                  onDelete={() => onDeleteTask(factor.id, task.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
      <ConfirmModal
        open={showConfirm}
        title="Eliminación de factor"
        message={
          factor.tareas.length > 0
            ? "Esto eliminará el factor seleccionado y también las siguientes tareas asociadas:"
            : "¿Estás seguro de que deseas eliminar este factor?"
        }
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          onDelete();
          setShowConfirm(false);
        }}
        confirmText="Eliminar de todas maneras"
      >
        {factor.tareas.length > 0 && (
          <ul className="list-disc list-inside text-sm text-gray-700 max-h-32 overflow-auto pr-2">
            {factor.tareas.map((t) => (
              <li key={t.id}>{t.nombre || "Sin nombre"}</li>
            ))}
          </ul>
        )}
      </ConfirmModal>
    </div>
  );
}
