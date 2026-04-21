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
import { FactorCard } from "./factor-card";
import type {
  StrategicProjectStructureFactor as Factor,
  StrategicProjectStructureTask as Task,
  TaskParticipant,
} from "../../types/strategicProjectStructure";

interface FactorCardsContainerProps {
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

export function FactorCardsContainer({
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
}: FactorCardsContainerProps) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {factors.map((factor, index) => (
            <FactorCard
              key={factor.id}
              factor={factor}
              orderNumber={index + 1}
              isExpanded={expandedMap[factor.id] ?? false}
              editingTaskId={editingTaskByFactor[factor.id]}
              isEditing={editingFactorId === factor.id}
              onToggleExpand={() => toggleExpandFactor(factor.id)}
              onEditFactor={() => editFactor(factor.id)}
              onDeleteFactor={() => deleteFactor(factor.id)}
              onAddTask={() => addTask(factor.id)}
              onEditTask={(taskIndex) => editTask(factor.id, taskIndex)}
              onDeleteTask={(taskIndex) => deleteTask(factor.id, taskIndex)}
              onSaveTask={(task, participants) => saveTask(factor.id, task, participants)}
              onCancelTask={(taskIndex) => cancelTask(factor.id, taskIndex)}
              onSaveFactor={(factor) => saveFactor(factor)}
              reorderTasks={(factorId, newOrder) => reorderTasks(factorId, newOrder)}
              canUpdate={permissions.factorsUpdate}
              canDelete={permissions.factorsDelete}
              canReorder={permissions.factorsReorder}
              dragDisabled={dragDisabled}
              dragDisabledReason={dragDisabledReason}
              businessUnitId={businessUnitId}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}