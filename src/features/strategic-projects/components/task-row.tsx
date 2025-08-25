"use client";

import { useState } from "react";
import { Task } from "../types/types";
import { DateRange } from "react-day-picker";
import { TaskRowEditor } from "./task-row-editor";
import { TaskRowResume } from "./task-row-resume";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { DraggableAttributes } from "@dnd-kit/core";
import { ConfirmModal } from "@/shared/components/confirm-modal";

interface TaskRowProps {
  task: Task;
  onEdit: () => void;
  onSave: (task: Task) => void;
  onCancel: () => void;
  onDelete: () => void;
  isDragging?: boolean;
  listeners: SyntheticListenerMap;
  attributes: DraggableAttributes;
}

export function TaskRow({
  task,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  isDragging = false,
  listeners,
  attributes,
}: TaskRowProps) {
  const [range, setRange] = useState<DateRange>({
    from: task.fechaInicio ? new Date(task.fechaInicio) : undefined,
    to: task.fechaFin ? new Date(task.fechaFin) : undefined,
  });
  const [showConfirm, setShowConfirm] = useState(false);
  

  const formatShortDate = (date?: Date) => {
    if (!date) return "";
    const month = date.toLocaleString("es-ES", { month: "short" });
    const day = date.getDate();
    return `${month}. ${day}`;
  };

  return (
    <div
      className={`p-4 transition-all ${
        isDragging ? "bg-green-50" : "bg-white hover:bg-gray-50"
      }`}
    >
      {task.enEdicion ? (
        <TaskRowEditor task={task} onSave={onSave} onCancel={onCancel} />
      ) : (
        <TaskRowResume
          task={task}
          onEdit={onEdit}
          onRequestDelete={() => setShowConfirm(true)}
          onSave={onSave}
          range={range}
          setRange={setRange}
          formatShortDate={formatShortDate}
          listeners={listeners}
          attributes={attributes}
        />
      )}
      <ConfirmModal
        open={showConfirm}
        title="Eliminación de Tarea"
        message="¿Estás seguro de que deseas eliminar esta tarea?"
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          onDelete();
          setShowConfirm(false);
        }}
        confirmText="Eliminar de todas maneras"
      />
    </div>
  );
}
