"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { Button } from "@/components/ui/button";
import { TextareaWithCounter } from "@/shared/components/textarea-with-counter";
import { TaskItemRow } from "./task-item-row";
import { ConfirmModal } from "@/shared/components/confirm-modal";
import {
  StrategicProjectStructureFactor as Factor,
  StrategicProjectStructureTask as Task,
  TaskParticipant,
} from "../../types/strategicProjectStructure";

interface FactorCardCompactProps {
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
  onEditTask: (taskIndex: number) => void;
  onSaveTask: (task: Task, participants: TaskParticipant[]) => void;
  onCancelTask: (taskIndex: number, isNew?: boolean) => void;
  onDeleteTask: (taskIndex: number) => void;
  onReorderTasks: (newOrder: Task[]) => void;
  dragDisabled?: boolean;
  dragDisabledReason?: string;
  variant?: string;
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
  isEditingActive: boolean;
}

export function FactorCardCompact({
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
  onEditTask,
  onSaveTask,
  onCancelTask,
  onDeleteTask,
  onReorderTasks,
  dragDisabled = false,
  dragDisabledReason = "",
  variant = "compact",
  permissions,
  businessUnitId,
  isEditingActive,
}: FactorCardCompactProps) {
  const [editedFactor, setEditedFactor] = useState<Factor>({ ...factor });
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: factor.id, disabled: dragDisabled || isEditingActive || !permissions.factorsReorder });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const tareasCompletadas = (factor.tasks ?? []).filter(
    (t) => (t.status ?? "").toUpperCase() === "CLO",
  ).length;
  const totalTareas = (factor.tasks ?? []).length;
  const progreso = totalTareas > 0 ? tareasCompletadas / totalTareas : 0;
  const progressColor = progreso === 1 ? "border-l-green-500" : progreso > 0 ? "border-l-yellow-400" : "border-l-gray-300";

  const handleChange = (field: keyof Factor, value: any) => {
    setEditedFactor({ ...editedFactor, [field]: value });
  };

  const handleSave = () => onSave(editedFactor);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

  const renderProgressBar = () => {
    const progressValue = Math.round(progreso * 100);
    return (
      <div className="flex items-center gap-2 w-full">
        <div className="relative h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-green-500 rounded-full transition-all duration-300"
            style={{ width: `${progressValue}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {tareasCompletadas}/{totalTareas}
        </span>
      </div>
    );
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={sortableStyle}
        className={`grid grid-cols-[35%_35%_20%_10%] bg-white hover:bg-gray-50 border-t border-gray-200 border-l-4 ${progressColor}`}
      >
        <div className="flex items-center gap-2 px-3 py-3">
          <div
            className={`flex items-center ${
              isEditingActive || !permissions.factorsReorder ? "cursor-not-allowed opacity-50" : "cursor-grab"
            }`}
            {...(isEditingActive || !permissions.factorsReorder ? {} : { ...listeners, ...attributes })}
          >
            <GripVertical size={16} className="text-gray-400" />
          </div>
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
          {isEditing ? (
            <TextareaWithCounter
              value={editedFactor.name ?? ""}
              onValueChange={(val) => handleChange("name", val)}
              maxLength={150}
              className="min-h-[40px] text-sm flex-1"
            />
          ) : (
            <span className="text-sm font-medium text-gray-800 truncate">
              {factor.name ?? "Factor sin nombre"}
            </span>
          )}
        </div>

        <div className="flex items-center px-3 py-3">
          {isEditing ? (
            <TextareaWithCounter
              value={editedFactor.result ?? ""}
              onValueChange={(val) => handleChange("result", val)}
              maxLength={300}
              className="min-h-[40px] text-sm"
            />
          ) : (
            <span className="text-xs text-gray-500 line-clamp-2">
              {factor.result || "Sin resultado"}
            </span>
          )}
        </div>

        <div className="flex items-center justify-center px-3 py-3">
          {!isEditing && renderProgressBar()}
        </div>

        <div className="flex items-center justify-end gap-1 px-3 py-3">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancel}
                className="h-7 w-7"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSave}
                className="h-7 w-7 text-green-600"
              >
                <Save className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              {permissions.tasksCreate && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onAddTask}
                  disabled={isEditingActive}
                  className={`h-7 w-7 text-blue-500 ${isEditingActive ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              )}
              {permissions.factorsUpdate && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEdit}
                  disabled={isEditingActive}
                  className={`h-7 w-7 ${isEditingActive ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              )}
              {permissions.factorsDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowConfirm(true)}
                  disabled={isEditingActive}
                  className={`h-7 w-7 text-red-500 ${isEditingActive ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

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
    </>
  );
}
