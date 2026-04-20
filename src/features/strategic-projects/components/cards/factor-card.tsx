"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  type DraggableAttributes,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import {
  GripVertical,
  Edit,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TextareaWithCounter } from "@/shared/components/textarea-with-counter";
import { TaskItemCard } from "./task-item-card";
import { ConfirmModal } from "@/shared/components/confirm-modal";
import {
  StrategicProjectStructureFactor as Factor,
  StrategicProjectStructureTask as Task,
  TaskParticipant,
} from "../../types/strategicProjectStructure";

interface FactorCardProps {
  factor: Factor;
  orderNumber: number;
  isEditing: boolean;
  editingTaskId?: string | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onSave: (factor: Factor) => void;
  onCancel: () => void;
  onDelete: () => void;
  onAddTask: () => void;
  onEditTask: (taskIndex: number) => void;
  onSaveTask: (task: Task, participants: TaskParticipant[]) => void;
  onCancelTask: (taskIndex: number, isNew?: boolean) => void;
  onDeleteTask: (taskIndex: number) => void;
  onReorderTasks: (newOrder: Task[]) => void;
  dragDisabled?: boolean;
  dragDisabledReason?: string;
  listeners?: SyntheticListenerMap;
  attributes?: DraggableAttributes;
  permissions: {
    factorsUpdate: boolean;
    factorsDelete: boolean;
    factorsReorder: boolean;
    tasksCreate: boolean;
    tasksUpdate: boolean;
    tasksDelete: boolean;
    tasksReorder: boolean;
  };
  businessUnitId?: string;
}

export function FactorCard({
  factor,
  orderNumber,
  isEditing,
  editingTaskId,
  isExpanded,
  onToggleExpand,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onAddTask,
  onEditTask,
  onSaveTask,
  onCancelTask,
  onDeleteTask,
  onReorderTasks,
  dragDisabled = false,
  dragDisabledReason = "",
  listeners,
  attributes,
  permissions,
  businessUnitId,
}: FactorCardProps) {
  const [editedFactor, setEditedFactor] = useState<Factor>({ ...factor });
  const [showConfirm, setShowConfirm] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  const tareasCompletadas = (factor.tasks ?? []).filter(
    (t) => (t.status ?? "").toUpperCase() === "CLO",
  ).length;
  const totalTareas = (factor.tasks ?? []).length;
  const progreso = totalTareas > 0 ? tareasCompletadas / totalTareas : 0;

  const handleChange = (field: keyof Factor, value: unknown) => {
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
      onReorderTasks(reordered);
    }
  };

  const progressValue = Math.round(progreso * 100);

  const blockedProps: React.HTMLAttributes<HTMLDivElement> = {
    onMouseDown: (e) => {
      e.preventDefault();
      e.stopPropagation();
    },
  };

  const sortableProps = (!dragDisabled
    ? { ...(listeners ?? {}), ...(attributes ?? {}) }
    : {}) as unknown as React.HTMLAttributes<HTMLDivElement>;

  return (
    <div className="bg-white rounded-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col min-h-[200px]">
      <div
        className={`p-5 ${dragDisabled ? "cursor-not-allowed opacity-60" : "cursor-grab"}`}
        {...(dragDisabled ? blockedProps : sortableProps)}
      >
        <div className="flex items-start gap-4">
          <div className="flex items-center gap-1 text-gray-400 hover:text-gray-600 pt-1">
            <GripVertical size={16} />
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            {/* 1. Número + Expand + Nombre */}
            <div className="flex items-center gap-3">
              <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs font-bold">
                #{orderNumber}
              </Badge>
              
              {!isEditing && (
                <button
                  onClick={onToggleExpand}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
              
              {isEditing ? (
                <div className="flex-1">
                  <TextareaWithCounter
                    value={editedFactor.name ?? ""}
                    onValueChange={(val) => handleChange("name", val)}
                    maxLength={150}
                    className="min-h-[40px] text-sm"
                  />
                </div>
              ) : (
                <h3 className="text-sm font-semibold text-gray-800 truncate flex-1">
                  {factor.name ?? "Factor sin nombre"}
                </h3>
              )}
            </div>

            {/* 2. Resultado */}
            {isEditing ? (
              <div>
                <TextareaWithCounter
                  value={editedFactor.result ?? ""}
                  onValueChange={(val) => handleChange("result", val)}
                  maxLength={300}
                  className="min-h-[60px] text-xs"
                />
              </div>
            ) : (
              <p className="text-xs text-gray-500 line-clamp-2">
                <span className="font-medium">Resultado: </span>
                {factor.result || "Sin resultado definido"}
              </p>
            )}

            {/* 3. Título Tareas + Barra de progreso */}
            {!isEditing && (
              <div>
                <div className="text-xs font-medium text-gray-600 mb-2">
                  Tareas:
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressValue}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {tareasCompletadas}/{totalTareas}
                  </span>
                </div>
              </div>
            )}

            {/* 4. Botones de acción */}
            <div className="flex items-center justify-between pt-2">
              {isEditing ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancel}
                    className="h-7 text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="h-7 text-xs bg-green-600 hover:bg-green-700"
                  >
                    Guardar
                  </Button>
                </div>
              ) : (
                <>
                  {permissions.tasksCreate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onAddTask}
                      className="h-7 text-xs text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar tarea
                    </Button>
                  )}
                  <div className="flex gap-1">
                    {permissions.factorsUpdate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onEdit}
                        className="h-7 w-7"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {permissions.factorsDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowConfirm(true)}
                        className="h-7 w-7 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (factor.tasks?.length ?? 0) > 0 && (
        <div className="border-t bg-gray-50 p-4 space-y-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEndTask}
          >
            <SortableContext
              items={(factor.tasks ?? []).map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {factor.tasks?.map((task, index) => (
                <TaskItemCard
                  key={task.id}
                  task={task}
                  participants={task.participants}
                  isEditing={editingTaskId === task.id}
                  onEdit={() => onEditTask(index)}
                  onSave={onSaveTask}
                  onCancel={() => onCancelTask(index)}
                  onDelete={() => onDeleteTask(index)}
                  dragDisabled={dragDisabled}
                  dragDisabledReason={dragDisabledReason}
                  canUpdate={permissions.tasksUpdate}
                  canDelete={permissions.tasksDelete}
                  canReorder={permissions.tasksReorder}
                  businessUnitId={businessUnitId}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {isExpanded && (factor.tasks?.length ?? 0) === 0 && (
        <div className="border-t p-4 text-center text-xs text-gray-400 bg-gray-50">
          No hay tareas en este factor
        </div>
      )}

      <ConfirmModal
        open={showConfirm}
        title="Eliminar factor"
        message={
          (factor.tasks?.length ?? 0) > 0
            ? "Esto eliminará el factor y todas sus tareas relacionadas."
            : "¿Estás seguro de que deseas eliminar este factor?"
        }
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          onDelete();
          setShowConfirm(false);
        }}
        confirmText="Eliminar"
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