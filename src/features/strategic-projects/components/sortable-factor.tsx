"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  StrategicProjectStructureFactor as Factor,
  StrategicProjectStructureTask as Task,
} from "../types/strategicProjectStructure";
import { FactorRow } from "./factor-row";
import type { DraggableAttributes } from "@dnd-kit/core";

interface SortableFactorProps {
  rowNumber: number;
  factor: Factor;
  isExpanded: boolean;
  isEditing?: boolean;
  editingTaskId?: string | null;
  onToggleExpand: () => void;
  onEdit: () => void;
  onSave: (factor: Factor) => void;
  onCancel: () => void;
  onDelete: () => void;
  onAddTask: () => void;
  countCompletedTasks: () => number;
  hasItemInCreation: () => boolean;
  onEditTask: (factorRowNumber: number, taskRowNumber: number) => void;
  onSaveTask: (factorRowNumber: number, task: Task) => void;
  onCancelTask: (
    factorRowNumber: number,
    taskRowNumber: number,
    isNew?: boolean
  ) => void;
  onDeleteTask: (factorRowNumber: number, taskRowNumber: number) => void;
  onReorderTasks: (factorRowNumber: number, newOrder: Task[]) => void;
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

export function SortableFactor({
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
  onEditTask,
  onSaveTask,
  onCancelTask,
  onDeleteTask,
  onReorderTasks,
  dragDisabled = false,
  dragDisabledReason = "",
  permissions,
}: SortableFactorProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: factor.id,
    disabled: dragDisabled,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style}>
      <FactorRow
        rowNumber={rowNumber}
        factor={factor}
        isExpanded={isExpanded}
        isEditing={!!isEditing}
        editingTaskId={editingTaskId ?? null}
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
        attributes={attributes ?? ({} as DraggableAttributes)}
        dragDisabled={dragDisabled}
        dragDisabledReason={dragDisabledReason}
        permissions={permissions}
      />
    </div>
  );
}
