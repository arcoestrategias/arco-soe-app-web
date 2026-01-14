"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  StrategicProjectStructureFactor as Factor,
  StrategicProjectStructureTask as Task,
} from "../types/strategicProjectStructure";
import { SortableFactor } from "./sortable-factor";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

interface HierarchicalTableProps {
  factors: Factor[];
  loading: boolean;
  expandedMap?: Record<string, boolean>;
  editingFactorId?: string | null;
  editingTaskByFactor?: Record<string, string | null>;

  toggleExpandFactor: (factorId: number | string) => void;

  editFactor: (factorRowNumber: number) => void;
  saveFactor: (factor: Factor) => void;
  cancelFactor: (factorRowNumber: number, isNew?: boolean) => void;
  deleteFactor: (factorRowNumber: number) => void;
  reorderFactors: (newOrder: Factor[]) => void;

  addTask: (factorRowNumber: number) => void;
  editTask: (factorRowNumber: number, taskRowNumber: number) => void;
  saveTask: (factorRowNumber: number, task: Task) => void;
  cancelTask: (
    factorRowNumber: number,
    taskRowNumber: number,
    isNew?: boolean
  ) => void;
  deleteTask: (factorRowNumber: number, taskRowNumber: number) => void;
  reorderTasks: (factorRowNumber: number, newOrder: Task[]) => void;

  countCompletedTasks: (tasks: Task[]) => number;
  hasItemInCreation: () => boolean;

  dragDisabled?: boolean;
  dragDisabledReason?: string;

  permissions: {
    factorsRead: boolean;
    factorsCreate: boolean;
    factorsUpdate: boolean;
    factorsDelete: boolean;
    factorsReorder: boolean;
    tasksRead: boolean;
    tasksCreate: boolean;
    tasksUpdate: boolean;
    tasksDelete: boolean;
    tasksReorder: boolean;
  };
}

export function HierarchicalTable({
  factors,
  loading,
  expandedMap = {},
  editingFactorId,
  editingTaskByFactor = {},
  toggleExpandFactor,
  editFactor,
  saveFactor,
  cancelFactor,
  deleteFactor,
  reorderFactors,
  addTask,
  editTask,
  saveTask,
  cancelTask,
  deleteTask,
  reorderTasks,
  countCompletedTasks,
  hasItemInCreation,
  dragDisabled = false,
  dragDisabledReason = "",
  permissions,
}: HierarchicalTableProps) {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = factors.findIndex((f) => f.id === active.id);
    const newIndex = factors.findIndex((f) => f.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(factors, oldIndex, newIndex).map(
        (factor, index) => ({
          ...factor,
          order: index + 1,
        })
      );
      reorderFactors(reordered);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-12 w-full rounded-md" />
            <div className="pl-8">
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      {/* Encabezado */}
      <div className="grid grid-cols-12 gap-2 bg-gray-100 p-3 text-xs font-medium text-gray-600">
        <div className="col-span-4">Nombre</div>
        <div className="col-span-4">Resultado / Entregable</div>
        <div className="col-span-2">Estado</div>
        <div className="col-span-2 text-right">Acciones</div>
      </div>

      {/* Contenido */}
      <div className="divide-y">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={factors.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            {factors.map((factor, idx) => (
              <div key={factor.id} className="py-1">
                <SortableFactor
                  rowNumber={idx + 1}
                  factor={factor}
                  isExpanded={!!expandedMap[factor.id]}
                  isEditing={editingFactorId === factor.id}
                  editingTaskId={editingTaskByFactor[factor.id] ?? null}
                  onToggleExpand={() => toggleExpandFactor(factor.id)}
                  onEdit={() => editFactor(idx + 1)}
                  onSave={saveFactor}
                  onCancel={() => cancelFactor(idx + 1, false)}
                  onDelete={() => deleteFactor(idx + 1)}
                  onAddTask={() => addTask(idx + 1)}
                  countCompletedTasks={() =>
                    countCompletedTasks(factor.tasks ?? [])
                  }
                  hasItemInCreation={hasItemInCreation}
                  onEditTask={(factorNum, taskNum) =>
                    editTask(factorNum, taskNum)
                  }
                  onSaveTask={(factorNum, t) => saveTask(factorNum, t)}
                  onCancelTask={(factorNum, taskNum, isNew) =>
                    cancelTask(factorNum, taskNum, isNew)
                  }
                  onDeleteTask={(factorNum, taskNum) =>
                    deleteTask(factorNum, taskNum)
                  }
                  onReorderTasks={(factorNum, next) =>
                    reorderTasks(factorNum, next)
                  }
                  dragDisabled={dragDisabled}
                  dragDisabledReason={dragDisabledReason}
                  permissions={permissions}
                />
              </div>
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
