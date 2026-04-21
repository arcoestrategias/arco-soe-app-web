"use client";

import { useState } from "react";
import { Edit, Trash2, GripVertical } from "lucide-react";
import { createPortal } from "react-dom";
import { ConfirmModal } from "@/shared/components/confirm-modal";
import { Badge } from "@/components/ui/badge";
import type {
  StrategicProjectStructureTask as Task,
  TaskParticipant,
} from "../../types/strategicProjectStructure";

interface TaskItemCardMiniProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  canUpdate: boolean;
  canDelete: boolean;
}

function formatShortDate(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export function TaskItemCardMini({
  task,
  onEdit,
  onDelete,
  onToggleStatus,
  canUpdate,
  canDelete,
}: TaskItemCardMiniProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Tooltip state for extra participants
  const [showParticipantsTooltip, setShowParticipantsTooltip] = useState(false);
  const [participantsTooltipPos, setParticipantsTooltipPos] = useState({ x: 0, y: 0 });

  // Result tooltip state
  const [showResultTooltip, setShowResultTooltip] = useState(false);
  const [resultTooltipPos, setResultTooltipPos] = useState({ x: 0, y: 0 });

  const isDone = (task.status ?? "").toUpperCase() === "CLO";

  const activeParticipants = task.participants?.filter((p) => p.isActive) ?? [];

  const visibleParticipants = activeParticipants.slice(0, 2);
  const extraParticipants = activeParticipants.slice(2);

  const borderColor = isDone ? "border-l-green-500" : "border-l-yellow-400";

  return (
    <>
      <div
        className={`group bg-white border border-gray-100 border-l-4 ${borderColor} rounded-lg px-3 py-3.5 hover:shadow-sm hover:border-gray-300 transition-all`}
      >
        {/* 🔹 BLOQUE 1 */}
        <div className="flex items-start gap-2">
          {/* DRAG */}
          <div className="cursor-grab text-gray-300 hover:text-gray-500 mt-0.5">
            <GripVertical className="h-4 w-4" />
          </div>

          {/* TEXTO */}
          <div className="flex-1 min-w-0">
            <div
              className={`text-sm font-medium tracking-tight ${
                isDone ? "text-gray-400 line-through" : "text-gray-800"
              }`}
            >
              {task.name || "Tarea sin nombre"}
            </div>

            {task.result && (
              <div
                className="text-xs text-gray-500 mt-0.5 line-clamp-2"
                onMouseEnter={(e) => {
                  if ((task.result?.length ?? 0) > 0) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setResultTooltipPos({ x: rect.left, y: rect.bottom });
                    setShowResultTooltip(true);
                  }
                }}
                onMouseLeave={() => setShowResultTooltip(false)}
              >
                {task.result}
              </div>
            )}
          </div>

          {/* ACCIONES */}
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
            {canUpdate && (
              <button
                onClick={onEdit}
                className="p-1 rounded hover:bg-gray-100"
              >
                <Edit size={14} className="text-gray-400" />
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => setConfirmOpen(true)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <Trash2 size={14} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* 🔹 BLOQUE 2 */}
        <div className="flex items-center justify-between mt-3 ml-6">
          <Badge
            variant="outline"
            className="h-5 text-[10px] flex items-center gap-1 text-gray-500 border-gray-200"
          >
            <svg className="h-3 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatShortDate(task.fromAt)} - {formatShortDate(task.untilAt)}
          </Badge>

          <Badge
            onClick={canUpdate ? onToggleStatus : undefined}
            className={`h-5 text-[10px] flex items-center justify-center cursor-pointer transition-colors ${
              isDone
                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                : "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
            }`}
          >
            {isDone ? "Terminado" : "En proceso"}
          </Badge>
        </div>

        {/* 🔹 BLOQUE 3: PARTICIPANTES */}
        {activeParticipants.length > 0 && (
          <div className="flex items-center gap-1 mt-2 ml-6">
            {/* visibles */}
            {visibleParticipants.map((p) => (
              <Badge
                key={p.id}
                variant="secondary"
                className="text-[9px] px-1.5 py-0.5 h-5 bg-gray-100 text-gray-600 flex items-center"
              >
                {p.positionId
                  ? (p.positionName ?? "Cargo")
                  : (p.externalUserName ?? "Externo")}
              </Badge>
            ))}

            {/* +X */}
            {extraParticipants.length > 0 && (
              <div
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setParticipantsTooltipPos({
                    x: rect.left,
                    y: rect.bottom,
                  });
                  setShowParticipantsTooltip(true);
                }}
                onMouseLeave={() => setShowParticipantsTooltip(false)}
              >
                <Badge
                  variant="secondary"
                  className="text-[9px] px-1.5 py-0.5 h-5 bg-gray-200 text-gray-600 cursor-default flex items-center"
                >
                  +{extraParticipants.length}
                </Badge>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🔥 TOOLTIP PARTICIPANTES (PORTAL) */}
      {showParticipantsTooltip &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: participantsTooltipPos.y + 6,
              left: participantsTooltipPos.x,
              zIndex: 9999,
            }}
            className="bg-gray-900 text-white text-[10px] rounded-md px-2 py-1 shadow-lg whitespace-nowrap"
          >
            {extraParticipants
              .map((p) =>
                p.positionId
                  ? (p.positionName ?? "Cargo")
                  : (p.externalUserName ?? "Externo"),
              )
              .join(", ")}
          </div>,
          document.body,
        )}

      {/* 🔥 TOOLTIP RESULTADO (PORTAL) */}
      {showResultTooltip && task.result &&
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
            {task.result}
          </div>,
          document.body,
        )}

      {/* CONFIRM DELETE */}
      <ConfirmModal
        open={confirmOpen}
        title="Eliminar tarea"
        message={`¿Eliminar "${task.name}"?`}
        onConfirm={() => {
          onDelete();
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
