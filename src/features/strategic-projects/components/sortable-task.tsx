"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "../types/types";
import { TaskRow } from "./task-row";

interface Props {
  task: Task;
  onEdit: () => void;
  onSave: (task: Task) => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function SortableTask({
  task,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskRow
        task={task}
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
        onDelete={onDelete}
        isDragging={isDragging}
        listeners={listeners ?? {}}
        attributes={attributes ?? {}}
      />
    </div>
  );
}
