"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Factor, Task } from "../types/types";
import { FactorRow } from "./factor-row";
import type { DraggableAttributes } from "@dnd-kit/core";

interface SortableFactorProps {
  factor: Factor;
  onToggleExpand: () => void;
  onEdit: () => void;
  onSave: (factor: Factor) => void;
  onCancel: () => void;
  onDelete: () => void;
  onAddTask: () => void;
  countCompletedTasks: () => number;
  hasItemInCreation: () => boolean;
  onEditTask: (factorId: number, taskId: number) => void;
  onSaveTask: (factorId: number, task: Task) => void;
  onCancelTask: (factorId: number, taskId: number, isNew?: boolean) => void;
  onDeleteTask: (factorId: number, taskId: number) => void;
  onReorderTasks: (factorId: number, newOrder: Task[]) => void;
}

export function SortableFactor({
  factor,
  onToggleExpand,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onAddTask,
  countCompletedTasks,
  hasItemInCreation,
  onEditTask,
  onSaveTask,
  onCancelTask,
  onDeleteTask,
  onReorderTasks,
}: SortableFactorProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: factor.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <FactorRow
        factor={factor}
        isDragging={isDragging}
        onToggleExpand={onToggleExpand}
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
        onDelete={onDelete}
        onAddTask={onAddTask}
        countCompletedTasks={countCompletedTasks}
        hasItemInCreation={hasItemInCreation}
        onEditTask={onEditTask}
        onSaveTask={onSaveTask}
        onCancelTask={onCancelTask}
        onDeleteTask={onDeleteTask}
        onReorderTasks={onReorderTasks}
        listeners={listeners ?? {}}
        attributes={attributes ?? {}}
      />
    </div>
  );
}
