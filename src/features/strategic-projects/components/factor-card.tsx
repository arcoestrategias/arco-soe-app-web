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
  ChevronDown,
  ChevronRight,
  Edit,
  Plus,
  Save,
  X,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TextareaWithCounter } from "@/shared/components/textarea-with-counter";
import { TaskItem } from "./task-item";
import { ConfirmModal } from "@/shared/components/confirm-modal";
import { toast } from "sonner";
import type {
  StrategicProjectStructureFactor as Factor,
  StrategicProjectStructureTask as Task,
  TaskParticipant,
} from "../types/strategicProjectStructure";

type FactorCardVariant = "card" | "compact";

interface FactorCardProps {
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
  listeners: SyntheticListenerMap;
  attributes: DraggableAttributes;
  permissions: {
    factorsUpdate: boolean;
    factorsDelete: boolean;
    tasksCreate: boolean;
    tasksUpdate: boolean;
    tasksDelete: boolean;
    tasksReorder: boolean;
  };
  businessUnitId?: string;
  variant?: FactorCardVariant;
}

export function FactorCard({
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
  listeners,
  attributes,
  permissions,
  businessUnitId,
  variant = "card",
}: FactorCardProps) {
  const [editedFactor, setEditedFactor] = useState<Factor>({ ...factor });
  const [showConfirm, setShowConfirm] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  const tareasCompletadas = (factor.tasks ?? []).filter(
    (t) => (t.status ?? "").toUpperCase() === "CLO",
  ).length;
  const totalTareas = (factor.tasks ?? []).length;
  const progreso = totalTareas > 0 ? tareasCompletadas / totalTareas : 0;

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
      onReorderTasks(reordered);
    }
  };

  const showBlocked = () => {
    toast.info(
      dragDisabledReason ||
        "No puedes reordenar mientras hay cambios sin guardar.",
    );
  };

  const blockedMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    showBlocked();
  };

  const blockedProps: React.HTMLAttributes<HTMLDivElement> = {
    onMouseDown: blockedMouseDown,
  };

  const sortableProps = (!dragDisabled
    ? { ...(listeners ?? {}), ...(attributes ?? {}) }
    : {}) as unknown as React.HTMLAttributes<HTMLDivElement>;

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

  if (variant === "compact") {
    return renderCompactVariant({
      factor,
      isEditing,
      isExpanded,
      editedFactor,
      showConfirm,
      dragDisabled,
      sortableProps,
      blockedProps,
      handleChange,
      handleSave,
      onToggleExpand,
      onEdit,
      onCancel,
      onAddTask,
      onDelete,
      setShowConfirm,
      renderProgressBar,
      permissions,
    });
  }

  return renderCardVariant({
    factor,
    isEditing,
    isExpanded,
    editingTaskId,
    editedFactor,
    showConfirm,
    dragDisabled,
    sortableProps,
    blockedProps,
    handleChange,
    handleSave,
    sensors,
    onToggleExpand,
    onEdit,
    onCancel,
    onAddTask,
    onDelete,
    onEditTask,
    onSaveTask,
    onCancelTask,
    onDeleteTask,
    onReorderTasks,
    setShowConfirm,
    renderProgressBar,
    permissions,
    businessUnitId,
    dragDisabledReason,
  });
}

interface CardVariantProps {
  factor: Factor;
  isEditing: boolean;
  isExpanded: boolean;
  editingTaskId?: string | null;
  editedFactor: Factor;
  showConfirm: boolean;
  dragDisabled: boolean;
  sortableProps: React.HTMLAttributes<HTMLDivElement>;
  blockedProps: React.HTMLAttributes<HTMLDivElement>;
  handleChange: (field: keyof Factor, value: any) => void;
  handleSave: () => void;
  sensors: ReturnType<typeof useSensors>;
  onToggleExpand: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onAddTask: () => void;
  onDelete: () => void;
  onEditTask: (taskIndex: number) => void;
  onSaveTask: (task: Task, participants: TaskParticipant[]) => void;
  onCancelTask: (taskIndex: number, isNew?: boolean) => void;
  onDeleteTask: (taskIndex: number) => void;
  onReorderTasks: (newOrder: Task[]) => void;
  setShowConfirm: (show: boolean) => void;
  renderProgressBar: () => React.ReactNode;
  permissions: FactorCardProps["permissions"];
  businessUnitId?: string;
  dragDisabledReason: string;
}

function renderCardVariant({
  factor,
  isEditing,
  isExpanded,
  editingTaskId,
  editedFactor,
  showConfirm,
  dragDisabled,
  sortableProps,
  blockedProps,
  handleChange,
  handleSave,
  sensors,
  onToggleExpand,
  onEdit,
  onCancel,
  onAddTask,
  onDelete,
  onEditTask,
  onSaveTask,
  onCancelTask,
  onDeleteTask,
  onReorderTasks,
  setShowConfirm,
  renderProgressBar,
  permissions,
  businessUnitId,
  dragDisabledReason,
}: CardVariantProps) {
  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <div
        className={`p-4 ${
          dragDisabled ? "cursor-not-allowed opacity-60" : "cursor-grab"
        }`}
        {...(dragDisabled ? blockedProps : sortableProps)}
      >
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-1 text-gray-400 hover:text-gray-600 pt-1">
            <GripVertical size={16} />
          </div>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="mb-3">
                <label className="text-xs text-gray-500 mb-1 block">
                  Nombre del Factor
                </label>
                <TextareaWithCounter
                  value={editedFactor.name ?? ""}
                  onValueChange={(val) => handleChange("name", val)}
                  maxLength={150}
                  className="min-h-[60px]"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2">
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
                <h3 className="text-sm font-semibold text-gray-800 truncate">
                  {factor.name ?? "Factor sin nombre"}
                </h3>
              </div>
            )}

            {!isEditing && (
              <div className="ml-6 mb-3">{renderProgressBar()}</div>
            )}

            {isEditing ? (
              <div className="mb-3 ml-6">
                <label className="text-xs text-gray-500 mb-1 block">
                  Resultado Esperado
                </label>
                <TextareaWithCounter
                  value={editedFactor.result ?? ""}
                  onValueChange={(val) => handleChange("result", val)}
                  maxLength={300}
                  className="min-h-[60px]"
                />
              </div>
            ) : (
              <p className="text-xs text-gray-500 ml-6 line-clamp-2 mb-3">
                <span className="font-medium">Resultado esperado: </span>
                {factor.result || "Sin resultado definido"}
              </p>
            )}

            <div className="flex items-center justify-between ml-6">
              {isEditing ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancel}
                    className="h-8 text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="h-8 text-xs bg-green-600 hover:bg-green-700"
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
        <div className="border-t bg-gray-50">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => {
              const { active, over } = e;
              if (!over || active.id === over.id) return;
              const list = factor.tasks ?? [];
              const oldIndex = list.findIndex((t) => t.id === active.id);
              const newIndex = list.findIndex((t) => t.id === over.id);
              if (oldIndex !== -1 && newIndex !== -1) {
                const reordered = arrayMove(list, oldIndex, newIndex).map(
                  (t, i) => ({
                    ...t,
                    order: i + 1,
                  }),
                );
                onReorderTasks(reordered);
              }
            }}
          >
            <SortableContext
              items={(factor.tasks ?? []).map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-gray-200">
                {(factor.tasks ?? []).map((task, idx) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    participants={task.participants}
                    isEditing={editingTaskId === task.id}
                    onEdit={() => onEditTask(idx)}
                    onSave={(t, p) => onSaveTask(t, p)}
                    onCancel={() => onCancelTask(idx, false)}
                    onDelete={() => onDeleteTask(idx)}
                    dragDisabled={dragDisabled}
                    dragDisabledReason={dragDisabledReason}
                    canUpdate={permissions.tasksUpdate}
                    canDelete={permissions.tasksDelete}
                    canReorder={permissions.tasksReorder}
                    businessUnitId={businessUnitId}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {isExpanded && (factor.tasks?.length ?? 0) === 0 && (
        <div className="border-t bg-gray-50 p-4 text-center">
          <p className="text-xs text-gray-400">No hay tareas en este factor</p>
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

interface CompactVariantProps {
  factor: Factor;
  isEditing: boolean;
  isExpanded: boolean;
  editedFactor: Factor;
  showConfirm: boolean;
  dragDisabled: boolean;
  sortableProps: React.HTMLAttributes<HTMLDivElement>;
  blockedProps: React.HTMLAttributes<HTMLDivElement>;
  handleChange: (field: keyof Factor, value: any) => void;
  handleSave: () => void;
  onToggleExpand: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onAddTask: () => void;
  onDelete: () => void;
  setShowConfirm: (show: boolean) => void;
  renderProgressBar: () => React.ReactNode;
  permissions: FactorCardProps["permissions"];
}

function renderCompactVariant({
  factor,
  isEditing,
  isExpanded,
  editedFactor,
  showConfirm,
  dragDisabled,
  sortableProps,
  blockedProps,
  handleChange,
  handleSave,
  onToggleExpand,
  onEdit,
  onCancel,
  onAddTask,
  onDelete,
  setShowConfirm,
  renderProgressBar,
  permissions,
}: CompactVariantProps) {
  return (
    <>
      <div className="grid grid-cols-[35%_35%_20%_10%] bg-white hover:bg-gray-50  border-t border-gray-200">
        <div className="flex items-center gap-2 px-3 py-3">
          <div
            className={`flex items-center ${
              dragDisabled ? "cursor-not-allowed opacity-50" : "cursor-grab"
            }`}
            {...(dragDisabled ? blockedProps : sortableProps)}
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

        <div className="flex items-center px-3 py-3  border-gray-200">
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

        <div className="flex items-center justify-center px-3 py-3  border-gray-200">
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
                  className="h-7 w-7 text-blue-500"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              )}
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
                  className="h-7 w-7 text-red-500"
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

export function FactorTableHeader() {
  return (
    <div className="bg-orange-50">
      <div className="grid grid-cols-[35%_35%_20%_10%]">
        <div className="flex items-center px-3 py-2">
          <span className="text-[10px] font-medium text-orange-800 uppercase tracking-wide">
            Factor
          </span>
        </div>
        <div className="flex items-center px-3 py-2">
          <span className="text-[10px] font-medium text-orange-800 uppercase tracking-wide">
            Resultado
          </span>
        </div>
        <div className="flex items-center justify-center px-3 py-2">
          <span className="text-[10px] font-medium text-orange-800 uppercase tracking-wide">
            Progreso
          </span>
        </div>
        <div className="flex items-center justify-end px-3 py-2">
          <span className="text-[10px] font-medium text-orange-800 uppercase tracking-wide">
            Acciones
          </span>
        </div>
      </div>
    </div>
  );
}
