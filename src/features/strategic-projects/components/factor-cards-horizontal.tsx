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
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ArrowRight } from "lucide-react";
import { FactorCard } from "./factor-card";
import type {
  StrategicProjectStructureFactor as Factor,
  StrategicProjectStructureTask as Task,
  TaskParticipant,
} from "../types/strategicProjectStructure";

interface FactorCardsHorizontalProps {
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
  saveTask: (factorId: string, task: Task, participants: TaskParticipant[]) => void;
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
}

export function FactorCardsHorizontal({
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
}: FactorCardsHorizontalProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEndFactor}
    >
      <SortableContext
        items={factors.map((f) => f.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div className="flex flex-wrap gap-4 items-start">
          {factors.map((factor, index) => (
            <div key={factor.id} className="relative">
              <FactorCard
                factor={factor}
                isExpanded={expandedMap[factor.id] ?? false}
                isEditing={editingFactorId === factor.id}
                editingTaskId={editingTaskByFactor[factor.id]}
                onToggleExpand={() => toggleExpandFactor(factor.id)}
                onEdit={() => editFactor(factor.id)}
                onSave={saveFactor}
                onCancel={() => cancelFactor(factor.id)}
                onDelete={() => deleteFactor(factor.id)}
                onAddTask={() => addTask(factor.id)}
                onEditTask={(taskIndex) => editTask(factor.id, taskIndex)}
                onSaveTask={(task, participants) => saveTask(factor.id, task, participants)}
                onCancelTask={(taskIndex, isNew) => cancelTask(factor.id, taskIndex, isNew)}
                onDeleteTask={(taskIndex) => deleteTask(factor.id, taskIndex)}
                onReorderTasks={(newOrder) => reorderTasks(factor.id, newOrder)}
                dragDisabled={dragDisabled}
                dragDisabledReason={dragDisabledReason}
                listeners={{} as any}
                attributes={{} as any}
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
                variant="card"
              />

              {index < factors.length - 1 && (
                <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 z-10 hidden lg:flex items-center">
                  <div className="relative flex items-center">
                    <svg
                      width="40"
                      height="24"
                      viewBox="0 0 40 24"
                      fill="none"
                      className="text-gray-300"
                    >
                      <path
                        d="M0 12H30M30 12L22 6M30 12L22 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="animate-flow-arrow"
                      />
                      <style>{`
                        @keyframes flow-arrow {
                          0% { stroke-dashoffset: 40; }
                          100% { stroke-dashoffset: 0; }
                        }
                        .animate-flow-arrow {
                          stroke-dasharray: 8 4;
                          animation: flow-arrow 1s linear infinite;
                        }
                      `}</style>
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
