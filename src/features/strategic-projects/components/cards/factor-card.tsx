"use client";

import { useMemo, useState, useEffect, memo } from "react";
import { createPortal } from "react-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmModal } from "@/shared/components/confirm-modal";
import type { StrategicProjectStructureFactor as Factor } from "../../types/strategicProjectStructure";
import type { StrategicProjectStructureTask as Task, TaskParticipant } from "../../types/strategicProjectStructure";
import { TaskItemCardMini } from "./task-item-card-mini";
import { TaskEditorInline } from "./task-editor-inline";
import { toggleTaskStatus } from "./task-utils";

interface FactorCardProps {
  factor: Factor;
  orderNumber: number;
  isExpanded: boolean;
  editingTaskId?: string | null;
  isEditing?: boolean;
  onToggleExpand: () => void;
  onEditFactor: () => void;
  onDeleteFactor: () => void;
  onAddTask: () => void;
  onEditTask: (taskIndex: number) => void;
  onDeleteTask: (taskIndex: number) => void;
  onSaveTask: (task: Task, participants: TaskParticipant[]) => void;
  onCancelTask: (taskIndex: number) => void;
  onSaveFactor: (factor: Factor) => void;
  canUpdate: boolean;
  canDelete: boolean;
  canReorder: boolean;
  dragDisabled: boolean;
  dragDisabledReason: string;
  businessUnitId?: string;
}

function calculateTaskProgress(tasks: Task[]) {
  const completed = tasks.filter(
    (t) => (t.status ?? "").toUpperCase() === "CLO"
  ).length;
  const total = tasks.length;
  const progress = total > 0 ? completed / total : 0;
  return { completed, total, progress };
}

export const FactorCard = memo(function FactorCard({
  factor,
  orderNumber,
  isExpanded,
  editingTaskId,
  isEditing,
  onToggleExpand,
  onEditFactor,
  onDeleteFactor,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onSaveTask,
  onCancelTask,
  onSaveFactor,
  canUpdate,
  canDelete,
  canReorder,
  dragDisabled,
  dragDisabledReason,
  businessUnitId,
}: FactorCardProps) {
  const [editFactorDialogOpen, setEditFactorDialogOpen] = useState(false);
  const tasks = factor.tasks ?? [];
  const { completed, total, progress } = useMemo(
    () => calculateTaskProgress(tasks),
    [tasks]
  );

  const progressColor =
    progress === 1
      ? "bg-green-500"
      : progress > 0
        ? "bg-yellow-400"
        : "bg-gray-300";

  const [editData, setEditData] = useState({ name: factor.name ?? "", result: factor.result ?? "" });
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [showEditFactor, setShowEditFactor] = useState(false);
  const [showDeleteFactorConfirm, setShowDeleteFactorConfirm] = useState(false);

  const [showResultTooltip, setShowResultTooltip] = useState(false);
  const [resultTooltipPos, setResultTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isEditing) {
      setEditData({ name: factor.name ?? "", result: factor.result ?? "" });
      setShowEditFactor(true);
    }
  }, [isEditing, factor.name, factor.result]);

  const editingTask = editingTaskId ? tasks.find(t => t.id === editingTaskId) : null;

  const {
    attributes: sortableAttrs,
    listeners: sortableListeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: factor.id, disabled: dragDisabled || !canReorder });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveEdit = () => {
    if (!editData.name.trim()) {
      setErrors({ name: "El nombre es obligatorio" });
      return;
    }
    const updatedFactor: Factor = {
      ...factor,
      name: editData.name.trim(),
      result: editData.result.trim() || null,
    };
    onSaveFactor(updatedFactor);
    setShowEditFactor(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      {...sortableAttrs}
      className="group flex flex-col rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all bg-white"
    >
      <div className={`w-full h-1.5 ${progressColor}`} />

      <div className="flex flex-col">
        <div className="flex items-start justify-between p-4 pb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-[10px] text-gray-400 font-medium shrink-0">
              #{orderNumber}
            </span>
            <h3 
              onClick={onToggleExpand}
              className="text-base font-semibold text-gray-900 leading-snug truncate cursor-pointer hover:text-gray-700"
            >
              {factor.name || "Factor sin nombre"}
            </h3>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                setEditData({ name: factor.name ?? "", result: factor.result ?? "" });
                setShowEditFactor(true);
              }}
              className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-gray-100"
            >
              <Edit size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => setShowDeleteFactorConfirm(true)}
              className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-gray-100"
            >
              <Trash2 size={14} className="text-gray-400" />
            </button>
            <button
              onClick={onToggleExpand}
              className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-gray-100"
            >
              <MoreHorizontal size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="px-4">
          <p
            className="text-xs text-gray-500 line-clamp-2"
            onMouseEnter={(e) => {
              if (factor.result && factor.result.length > 50) {
                const rect = e.currentTarget.getBoundingClientRect();
                setResultTooltipPos({ x: rect.left, y: rect.bottom });
                setShowResultTooltip(true);
              }
            }}
            onMouseLeave={() => setShowResultTooltip(false)}
          >
            {factor.result || "Sin resultado definido"}
          </p>
        </div>

        {showResultTooltip && factor.result && factor.result.length > 50 &&
          createPortal(
            <div
              style={{
                position: "fixed",
                top: resultTooltipPos.y + 6,
                left: resultTooltipPos.x,
                zIndex: 9999,
              }}
              className="bg-gray-900 text-white text-xs rounded-md px-3 py-2 shadow-lg max-w-sm break-words"
            >
              {factor.result}
            </div>,
            document.body,
          )}

        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-xs text-gray-400">
              {completed}/{total} tareas
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {Math.round(progress * 100)}%
            </span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={onAddTask}
            className="h-7 w-7"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isExpanded && tasks.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-3">
{tasks.map((task, idx) => (
              <TaskItemCardMini
                key={task.id}
                task={task}
                onEdit={() => onEditTask(idx)}
                onDelete={() => onDeleteTask(idx)}
                onToggleStatus={() => toggleTaskStatus(task, onSaveTask)}
                canUpdate={canUpdate}
                canDelete={canDelete}
              />
            ))}
        </div>
      )}

      <Dialog open={showEditFactor} onOpenChange={setShowEditFactor}>
        <DialogContent className="w-96">
          <DialogHeader>
            <DialogTitle>Editar Factor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Nombre <span className="text-red-500">*</span>
              </label>
              <textarea
                value={editData.name}
                onChange={(e) => {
                  setEditData((prev) => ({ ...prev, name: e.target.value }));
                  if (errors.name) setErrors({});
                }}
                className="w-full min-h-[60px] rounded-md border border-input px-3 py-2 text-sm"
                placeholder="Nombre del factor"
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Resultado
              </label>
              <textarea
                value={editData.result}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, result: e.target.value }))
                }
                className="w-full min-h-[80px] rounded-md border border-input px-3 py-2 text-sm"
                placeholder="Resultado esperado"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowEditFactor(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveEdit}>
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={showDeleteFactorConfirm}
        title="Eliminar factor"
        message={`¿Estás seguro de que deseas eliminar el factor "${factor.name}"? ${
          total > 0
            ? ` Este factor tiene ${total} tarea${total > 1 ? "s" : ""}. También se eliminarán.`
            : ""
        }`}
        onConfirm={() => {
          onDeleteFactor();
          setShowDeleteFactorConfirm(false);
        }}
        onCancel={() => setShowDeleteFactorConfirm(false)}
      />

      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={(open) => !open && onCancelTask(tasks.findIndex(t => t.id === editingTaskId))}>
          <DialogContent className="w-[800px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTask.id.startsWith("__new__") ? "Nueva tarea" : "Editar tarea"}
              </DialogTitle>
            </DialogHeader>
            <TaskEditorInline
              task={editingTask}
              participants={editingTask.participants ?? []}
              onSave={(task, participants) => {
                onSaveTask(task, participants);
                onCancelTask(tasks.findIndex(t => t.id === editingTaskId));
              }}
              onCancel={() => onCancelTask(tasks.findIndex(t => t.id === editingTaskId))}
              businessUnitId={businessUnitId}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
});

FactorCard.displayName = 'FactorCard';