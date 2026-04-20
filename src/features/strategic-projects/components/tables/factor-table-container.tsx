"use client";

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
} from "@dnd-kit/sortable";
import { FactorCardCompact } from "./factor-card-compact";
import { TaskItemRow } from "./task-item-row";
import { FactorTableHeader } from "./factor-table-header";
import { TaskTableHeader } from "./task-table-header";
import type {
  StrategicProjectStructureFactor as Factor,
  StrategicProjectStructureTask as Task,
  TaskParticipant,
} from "../../types/strategicProjectStructure";

interface FactorTableCompactProps {
  factors: Factor[];
  expandedMap: Record<string, boolean>;
  editingFactorId: string | null;
  editingTaskByFactor: Record<string, string | null>;
  toggleExpandFactor: (factorId: string) => void;
  editFactor: (factorId: string) => void;
  saveFactor: (factor: Factor) => void;
  cancelFactor: (factorId: string) => void;
  deleteFactor: (factorId: string) => void;
  addTask: (factorId: string) => void;
  editTask: (factorId: string, taskIndex: number) => void;
  saveTask: (
    factorId: string,
    task: Task,
    participants: TaskParticipant[],
  ) => void;
  cancelTask: (factorId: string, taskIndex: number, isNew?: boolean) => void;
  deleteTask: (factorId: string, taskIndex: number) => void;
  reorderFactors: (newOrder: Factor[]) => void;
  reorderTasks: (factorId: string, newOrder: Task[]) => void;
  dragDisabled?: boolean;
  dragDisabledReason?: string;
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
  isEditingActive?: boolean;
}

export function FactorTableCompact({
  factors,
  expandedMap,
  editingFactorId,
  editingTaskByFactor,
  toggleExpandFactor,
  editFactor,
  saveFactor,
  cancelFactor,
  deleteFactor,
  addTask,
  editTask,
  saveTask,
  cancelTask,
  deleteTask,
  reorderFactors,
  reorderTasks,
  dragDisabled = false,
  dragDisabledReason = "",
  permissions,
  businessUnitId,
  isEditingActive = false,
}: FactorTableCompactProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragEndFactor = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = factors.findIndex((f) => f.id === active.id);
    const newIndex = factors.findIndex((f) => f.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = [...factors];
      const [removed] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, removed);
      reorderFactors(reordered);
    }
  };

  if (factors.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">
          No hay factores
        </h3>
        <p className="text-xs text-gray-500">
          Comienza agregando el primer factor clave de éxito.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEndFactor}
      >
        <SortableContext
          items={factors.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <FactorTableHeader />
          {factors.map((factor) => {
            const isExpanded = expandedMap[factor.id] ?? false;
            const tasks = factor.tasks ?? [];

            return (
              <div key={factor.id}>
                <FactorCardCompact
                  factor={factor}
                  isExpanded={isExpanded}
                  isEditing={editingFactorId === factor.id}
                  editingTaskId={editingTaskByFactor[factor.id]}
                  onToggleExpand={() => toggleExpandFactor(factor.id)}
                  onEdit={() => editFactor(factor.id)}
                  onSave={saveFactor}
                  onCancel={() => cancelFactor(factor.id)}
                  onDelete={() => deleteFactor(factor.id)}
                  onAddTask={() => addTask(factor.id)}
                  onEditTask={(taskIndex) => editTask(factor.id, taskIndex)}
                  onSaveTask={(task, participants) =>
                    saveTask(factor.id, task, participants)
                  }
                  onCancelTask={(taskIndex, isNew) =>
                    cancelTask(factor.id, taskIndex, isNew)
                  }
                  onDeleteTask={(taskIndex) => deleteTask(factor.id, taskIndex)}
                  onReorderTasks={(newOrder) =>
                    reorderTasks(factor.id, newOrder)
                  }
                  dragDisabled={dragDisabled}
                  dragDisabledReason={dragDisabledReason}
                  permissions={{
                    factorsUpdate: permissions.factorsUpdate,
                    factorsDelete: permissions.factorsDelete,
                    factorsReorder: permissions.factorsReorder,
                    tasksCreate: permissions.tasksCreate,
                    tasksUpdate: permissions.tasksUpdate,
                    tasksDelete: permissions.tasksDelete,
                    tasksReorder: permissions.tasksReorder,
                  }}
                  businessUnitId={businessUnitId}
                  variant="compact"
                  isEditingActive={isEditingActive}
                />

                {isExpanded && (
                  <div className="ml-6 pl-4 border-l-4 border-blue-300 bg-blue-50/20">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event: DragEndEvent) => {
                        const { active, over } = event;
                        if (!over || active.id === over.id) return;

                        const oldIndex = tasks.findIndex(
                          (t) => t.id === active.id,
                        );
                        const newIndex = tasks.findIndex(
                          (t) => t.id === over.id,
                        );

                        if (oldIndex !== -1 && newIndex !== -1) {
                          const reordered = [...tasks];
                          const [removed] = reordered.splice(oldIndex, 1);
                          reordered.splice(newIndex, 0, removed);
                          reorderTasks(factor.id, reordered);
                        }
                      }}
                    >
                      <SortableContext
                        items={tasks.map((t) => t.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {tasks.length > 0 ? (
                          <>
                            <TaskTableHeader
                              factorName={factor.name ?? "Factor sin nombre"}
                              completedTasks={
                                tasks.filter(
                                  (t) =>
                                    (t.status ?? "").toUpperCase() === "CLO",
                                ).length
                              }
                              totalTasks={tasks.length}
                            />
                            {tasks.map((task) => (
                              <TaskItemRow
                                key={task.id}
                                task={task}
                                participants={task.participants}
                                isEditing={
                                  editingTaskByFactor[factor.id] === task.id
                                }
                                onEdit={() => {
                                  const taskIndex = tasks.findIndex(
                                    (t) => t.id === task.id,
                                  );
                                  if (taskIndex !== -1)
                                    editTask(factor.id, taskIndex);
                                }}
                                onSave={(t, p) => saveTask(factor.id, t, p)}
                                onCancel={() => {
                                  const taskIndex = tasks.findIndex(
                                    (t) => t.id === task.id,
                                  );
                                  if (taskIndex !== -1)
                                    cancelTask(factor.id, taskIndex, false);
                                }}
                                onDelete={() => {
                                  const taskIndex = tasks.findIndex(
                                    (t) => t.id === task.id,
                                  );
                                  if (taskIndex !== -1)
                                    deleteTask(factor.id, taskIndex);
                                }}
                                dragDisabled={dragDisabled}
                                dragDisabledReason={dragDisabledReason}
                                canUpdate={permissions.tasksUpdate}
                                canDelete={permissions.tasksDelete}
                                canReorder={permissions.tasksReorder}
                                businessUnitId={businessUnitId}
                                variant="table"
                                isEditingActive={isEditingActive}
                              />
                            ))}
                          </>
                        ) : (
                          <div className="px-4 py-3 text-center text-xs text-gray-400 bg-gray-50">
                            No hay tareas en este factor
                          </div>
                        )}
                      </SortableContext>
                    </DndContext>
                  </div>
                )}
              </div>
            );
          })}
        </SortableContext>
      </DndContext>
    </div>
  );
}
