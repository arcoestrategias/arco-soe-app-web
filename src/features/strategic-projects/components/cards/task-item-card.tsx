"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  StrategicProjectStructureTask as Task,
  TaskParticipant,
} from "../../types/strategicProjectStructure";
import { TaskEditorInline } from "./task-editor-inline";
import { DateRangePicker } from "@/shared/components/single-date-picker";
import { usePlanRange } from "@/features/strategic-projects/context/plan-range.context";
import {
  projectRangeToDates,
  toYmd,
  parseYmdOrIsoToLocalDate,
} from "@/shared/utils/dateFormatters";
import { isValid, format } from "date-fns";
import { DateRange } from "react-day-picker";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { DraggableAttributes } from "@dnd-kit/core";
import { toast } from "sonner";

interface TaskItemCardProps {
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
  listeners?: SyntheticListenerMap;
  attributes?: DraggableAttributes;
}

interface ParticipantBadgesProps {
  participants: TaskParticipant[];
}

function ParticipantBadges({ participants }: ParticipantBadgesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(2);
  const badgeWidthRef = useRef<number>(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || participants.length === 0) return;

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

      setVisibleCount(Math.max(0, Math.min(count, 2)));
    };

    updateLayout();

    const observer = new ResizeObserver(updateLayout);
    observer.observe(el);
    return () => observer.disconnect();
  }, [participants.length]);

  if (participants.length === 0) {
    return <span className="text-[10px] text-gray-400">Sin responsables</span>;
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
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-purple-50 text-purple-700 border-purple-200"
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
          className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 shrink-0 cursor-help"
          title={participants.slice(visibleCount).map(p => 
            p.positionId ? (p.positionName ?? "Cargo") : (p.externalUserName ?? "Externo")
          ).join(", ")}
        >
          +{hiddenCount}
        </Badge>
      )}
    </div>
  );
}

export function TaskItemCard({
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
  listeners,
  attributes,
}: TaskItemCardProps) {
  const {
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
    if (!date || !isValid(date)) return "";
    return format(date, "dd/MM/yyyy");
  };

  const safeRangeLabel =
    range.from && isValid(range.from) && range.to && isValid(range.to)
      ? `${formatShortDate(range.from)} - ${formatShortDate(range.to)}`
      : "Sin fechas";

  const handleDateChange = (r?: DateRange) => {
    if (!r?.from || !r?.to || !isValid(r.from) || !isValid(r.to)) return;
    setRange(r);
    const next: Task = {
      ...task,
      fromAt: toYmd(r.from)!,
      untilAt: toYmd(r.to)!,
    };
    onSave(next, participants);
    setIsDateOpen(false);
  };

  const showBlocked = () => {
    toast.info(dragDisabledReason || "No puedes reordenar ahora");
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style}>
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

  const dragProps = canReorder
    ? dragDisabled
      ? { onMouseDown: (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); showBlocked(); } }
      : { ...listeners, ...attributes }
    : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all space-y-3 ${
        isDragging ? "opacity-50 bg-blue-50" : ""
      }`}
    >
      {canReorder && (
        <div
          className={`flex items-center ${
            dragDisabled
              ? "cursor-not-allowed opacity-50"
              : "cursor-grab text-gray-400 hover:text-gray-600"
          }`}
          {...dragProps}
        >
          <GripVertical size={16} />
        </div>
      )}

      <div className="text-sm font-semibold text-gray-800">
        {task.name || "Tarea sin nombre"}
      </div>

      <div className="text-xs text-gray-600">
        <span className="font-medium">Entregable: </span>
        {task.result || "Sin entregable definido"}
      </div>

      <div className="flex items-center gap-2">
        <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
          <PopoverTrigger asChild disabled={!canUpdate}>
            <button
              className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border ${
                canUpdate
                  ? "hover:bg-gray-100 cursor-pointer"
                  : "cursor-default"
              } ${isFinished ? "border-green-200 bg-green-50 text-green-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}
            >
              <Calendar className="h-3 w-3" />
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

      <div className="flex items-center justify-between">
        <Badge
          className={`text-[10px] px-2 py-0.5 ${
            isFinished
              ? "bg-green-100 text-green-700 border-green-200"
              : "bg-yellow-100 text-yellow-700 border-yellow-200"
          }`}
        >
          {isFinished ? "Terminado" : "En proceso"}
        </Badge>
        <div className="flex items-center gap-1">
          {canUpdate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-7 w-7"
            >
              <Edit className="h-4 w-4 text-gray-500" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteConfirm(true)}
              className="h-7 w-7"
            >
              <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
            </Button>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <ParticipantBadges participants={activeParticipants} />
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm mx-4">
            <h4 className="text-sm font-semibold mb-2">Eliminar tarea</h4>
            <p className="text-xs text-gray-600 mb-4">
              ¿Estás seguro de que deseas eliminar esta tarea?
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-red-500 hover:bg-red-600"
                onClick={onDelete}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}