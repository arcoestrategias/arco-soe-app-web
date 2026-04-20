"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  StrategicProjectStructureTask as Task,
  TaskParticipant,
} from "../../types/strategicProjectStructure";
import { TaskEditorInline } from "../cards/task-editor-inline";
import { DateRangePicker } from "@/shared/components/single-date-picker";
import { usePlanRange } from "@/features/strategic-projects/context/plan-range.context";
import {
  projectRangeToDates,
  parseYmdOrIsoToLocalDate,
} from "@/shared/utils/dateFormatters";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";

interface TaskItemRowProps {
  task: Task;
  participants: TaskParticipant[];
  isEditing?: boolean;
  isEditingActive?: boolean;
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
  variant?: string;
}

export function TaskItemRow({
  task,
  participants,
  isEditing = false,
  isEditingActive = false,
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
  variant = "table",
}: TaskItemRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: dragDisabled || !canReorder });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isFinished =
    !!task.finishedAt || (task.status ?? "").toUpperCase() === "CLO";
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { planFromAt, planUntilAt } = usePlanRange();
  const { min: minDate, max: maxDate } = projectRangeToDates(
    planFromAt,
    planUntilAt,
  );

  const [range, setRange] = useState<DateRange>({
    from: parseYmdOrIsoToLocalDate(task.fromAt),
    to: parseYmdOrIsoToLocalDate(task.untilAt),
  });

  const activeParticipants = participants.filter((p) => p.isActive);

  const formatShortDate = (date?: Date) => {
    if (!date) return "";
    return format(date, "dd/MM/yyyy");
  };

  const safeRangeLabel =
    range.from && range.to
      ? `${formatShortDate(range.from)} - ${formatShortDate(range.to)}`
      : "Sin fechas";

  const toggleStatus = () => {
    if (!canUpdate || isEditingActive) return;
    const next: Task = {
      ...task,
      status: isFinished ? "OPE" : "CLO",
      finishedAt: isFinished ? null : new Date().toISOString(),
    };
    onSave(next, participants);
  };

  const handleDateChange = (r?: DateRange) => {
    if (!r?.from || !r?.to) return;
    setRange(r);
    const next: Task = {
      ...task,
      fromAt: r.from.toISOString().split("T")[0],
      untilAt: r.to.toISOString().split("T")[0],
    };
    onSave(next, participants);
    setIsDateOpen(false);
  };

  const showBlocked = () => {
    toast.info(dragDisabledReason || "No puedes reordenar ahora");
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="border-t bg-white">
        <TaskEditorInline
          task={task}
          participants={participants}
          onSave={onSave}
          onCancel={onCancel}
          businessUnitId={businessUnitId}
        />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-[35%_30%_15%_10%_10%] border-t bg-white hover:bg-gray-50 transition-colors ${
        isDragging ? "opacity-50 bg-blue-50" : ""
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <div
          className={`flex items-center ${
            dragDisabled
              ? "cursor-not-allowed opacity-50"
              : "cursor-grab text-gray-400 hover:text-gray-600"
          }`}
          {...(dragDisabled ? {} : { ...listeners, ...attributes })}
          onMouseDown={
            dragDisabled
              ? (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  showBlocked();
                }
              : undefined
          }
        >
          <GripVertical size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={`text-xs font-semibold truncate ${isFinished ? "text-gray-400 line-through" : "text-gray-800"}`}
          >
            {task.name || "Tarea sin nombre"}
          </div>
          {task.result && (
            <div className="text-[10px] text-gray-500 truncate">
              Entregable: {task.result}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center px-3 py-2">
        <ParticipantBadges participants={activeParticipants} />
      </div>

      <div className="flex items-center justify-center px-3 py-2">
        <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
          <PopoverTrigger asChild disabled={!canUpdate || isEditingActive}>
            <button
              className={`text-[10px] px-1.5 py-0.5 rounded border ${!canUpdate || isEditingActive ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100 cursor-pointer"} ${isFinished ? "border-green-200 bg-green-50 text-green-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}
            >
              {safeRangeLabel}
            </button>
          </PopoverTrigger>
          {canUpdate && (
            <PopoverContent className="w-auto p-4" align="start">
              <DateRangePicker
                date={undefined}
                onChange={(newRange) => newRange && setIsDateOpen(false)}
                showToastOnApply={false}
                minDate={minDate}
                maxDate={maxDate}
                onClose={() => setIsDateOpen(false)}
                onApply={handleDateChange}
              />
            </PopoverContent>
          )}
        </Popover>
      </div>

      <div className="flex items-center justify-center px-3 py-2">
        {canUpdate ? (
          <Badge
            onClick={isEditingActive ? undefined : toggleStatus}
            className={`${isEditingActive ? "cursor-not-allowed opacity-60" : "cursor-pointer"} text-[10px] ${
              isFinished
                ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                : "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200"
            }`}
          >
            {isFinished ? "Terminado" : "En proceso"}
          </Badge>
        ) : (
          <Badge
            className={`text-[10px] ${
              isFinished
                ? "bg-green-100 text-green-700 border-green-200"
                : "bg-yellow-100 text-yellow-700 border-yellow-200"
            }`}
          >
            {isFinished ? "Terminado" : "En proceso"}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1 justify-end px-3 py-2">
        {canUpdate && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            disabled={isEditingActive}
            className={`h-6 w-6 ${isEditingActive ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Edit className="h-3 w-3 text-gray-500" />
          </Button>
        )}
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isEditingActive}
            className={`h-6 w-6 ${isEditingActive ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Trash2 className="h-3 w-3 text-red-400 hover:text-red-600" />
          </Button>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="col-span-5 p-0">
          <DeleteConfirmModal
            onConfirm={onDelete}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        </div>
      )}
    </div>
  );
}

interface ParticipantBadgesProps {
  participants: TaskParticipant[];
}

function ParticipantBadges({ participants }: ParticipantBadgesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const badgeWidthRef = useRef<number>(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateLayout = () => {
      const width = el.offsetWidth;

      const badges = el.querySelectorAll("[data-badge]");
      if (badges.length > 0) {
        const firstBadge = badges[0] as HTMLElement;
        badgeWidthRef.current = firstBadge.offsetWidth + 4;
      }

      const spaceForPlus = 40;
      const availableWidth = width - spaceForPlus;
      const count = Math.floor(availableWidth / badgeWidthRef.current);

      setVisibleCount(Math.max(0, count));
    };

    updateLayout();

    const observer = new ResizeObserver(updateLayout);
    observer.observe(el);
    return () => observer.disconnect();
  }, [participants.length]);

  if (participants.length === 0) {
    return <span className="text-[10px] text-gray-400">—</span>;
  }

  const visibleParticipants = visibleCount > 0
    ? participants.slice(0, visibleCount)
    : participants;
  const hiddenCount = participants.length - visibleParticipants.length;

  return (
    <div ref={containerRef} className="flex items-center gap-1 w-full">
      {visibleParticipants.map((p) => (
        <Badge
          key={p.id}
          data-badge
          variant="secondary"
          className={`text-[10px] px-1.5 py-0.5 whitespace-nowrap shrink-0 ${
            p.positionId
              ? "bg-blue-50 text-blue-700"
              : "bg-purple-50 text-purple-700"
          }`}
        >
          {p.positionId
            ? (p.positionName ?? "Cargo")
            : (p.externalUserName ?? "Ext.")}
        </Badge>
      ))}
      {hiddenCount > 0 && (
        <Badge
          variant="secondary"
          className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 shrink-0"
        >
          +{hiddenCount}
        </Badge>
      )}
    </div>
  );
}

function DeleteConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm mx-4">
        <h4 className="text-sm font-semibold mb-2">Eliminar tarea</h4>
        <p className="text-xs text-gray-600 mb-4">
          ¿Estás seguro de que deseas eliminar esta tarea?
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            size="sm"
            className="bg-red-500 hover:bg-red-600"
            onClick={onConfirm}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}
