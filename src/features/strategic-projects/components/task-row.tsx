"use client";

import { useState } from "react";
import { StrategicProjectStructureTask as Task } from "../types/strategicProjectStructure";
import { DateRange } from "react-day-picker";
import { TaskRowEditor } from "./task-row-editor";
import { TaskRowResume } from "./task-row-resume";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { DraggableAttributes } from "@dnd-kit/core";
import { ConfirmModal } from "@/shared/components/confirm-modal";

// Utils de fechas centralizados
import { parseYmdOrIsoToLocalDate } from "@/shared/utils/dateFormatters";
import { isValid } from "date-fns";

interface TaskRowProps {
  task: Task;
  isEditing?: boolean;
  onEdit: () => void;
  onSave: (task: Task) => void;
  onCancel: () => void;
  onDelete: () => void;
  isDragging?: boolean;
  dragDisabled?: boolean;
  dragDisabledReason?: string;
  listeners: SyntheticListenerMap;
  attributes: DraggableAttributes;
}

export function TaskRow({
  task,
  isEditing = false,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  isDragging = false,
  dragDisabled = false,
  dragDisabledReason = "",
  listeners,
  attributes,
}: TaskRowProps) {
  const [range, setRange] = useState<DateRange>({
    from: parseYmdOrIsoToLocalDate(task.fromAt),
    to: parseYmdOrIsoToLocalDate(task.untilAt),
  });
  const [showConfirm, setShowConfirm] = useState(false);

  const formatShortDate = (date?: Date) => {
    if (!date || !isValid(date)) return "";
    const month = date.toLocaleString("es-ES", { month: "short" });
    const day = date.getDate();
    return `${month}. ${day}`;
    // Ej.: "sep. 2"
  };

  return (
    <div
      className={`p-4 transition-all ${
        isDragging ? "bg-green-50" : "bg-white hover:bg-gray-50"
      }`}
    >
      {isEditing ? (
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
          dragDisabled={dragDisabled}
          dragDisabledReason={dragDisabledReason}
          listeners={listeners}
          attributes={attributes}
        />
      )}

      <ConfirmModal
        open={showConfirm}
        title="Eliminación de Tarea"
        message="¿Estás seguro de que deseas inactivar esta tarea?"
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          onDelete();
          setShowConfirm(false);
        }}
        confirmText="Inactivar"
      />
    </div>
  );
}
