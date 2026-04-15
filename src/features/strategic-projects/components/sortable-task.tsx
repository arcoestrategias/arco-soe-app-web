"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  StrategicProjectStructureTask as Task,
  TaskParticipant,
} from "../types/strategicProjectStructure";
import { TaskRow } from "./task-row";

interface Props {
  task: Task;
  participants: TaskParticipant[];
  isEditing?: boolean;
  onEdit: () => void;
  onSave: (task: Task, participants: TaskParticipant[]) => void;
  onCancel: () => void;
  onDelete: () => void;
  dragDisabled?: boolean;
  dragDisabledReason?: string;
  canUpdate?: boolean;
  canDelete?: boolean;
  canReorder?: boolean;
  businessUnitId?: string;
}

export function SortableTask({
  task,
  participants,
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
  businessUnitId,
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
        participants={participants}
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
        businessUnitId={businessUnitId}
      />
    </div>
  );
}
