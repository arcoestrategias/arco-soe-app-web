"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { StrategicProjectStructureTask as Task } from "../types/strategicProjectStructure";
import { TaskRow } from "./task-row";

interface Props {
  task: Task;
  isEditing?: boolean;
  onEdit: () => void;
  onSave: (task: Task) => void;
  onCancel: () => void;
  onDelete: () => void;
  dragDisabled?: boolean;
  dragDisabledReason?: string;
  canUpdate?: boolean;
  canDelete?: boolean;
  canReorder?: boolean;
}

export function SortableTask({
  task,
  isEditing = false,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  dragDisabled = false,
  dragDisabledReason = "",
  canUpdate = false,
  canDelete = false,
  canReorder = false,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: dragDisabled || !canReorder,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskRow
        task={task}
        isEditing={isEditing}
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
        onDelete={onDelete}
        isDragging={isDragging}
        listeners={listeners ?? {}}
        attributes={attributes ?? {}}
        dragDisabled={dragDisabled || !canReorder}
        dragDisabledReason={
          !canReorder
            ? "No tienes permiso para reordenar tareas."
            : dragDisabledReason
        }
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}
