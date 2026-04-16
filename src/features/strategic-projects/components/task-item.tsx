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
import {
  StrategicProjectStructureTask as Task,
  TaskParticipant,
} from "../types/strategicProjectStructure";
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

type TaskItemVariant = "card" | "table";

interface TaskItemProps {
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
  variant?: TaskItemVariant;
}

export function TaskItem({
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
  variant = "card",
}: TaskItemProps) {
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
    if (!date || !isValid(date)) return "";
    return format(date, "dd/MM/yyyy");
  };

  const safeRangeLabel =
    range.from && isValid(range.from) && range.to && isValid(range.to)
      ? `${formatShortDate(range.from)} - ${formatShortDate(range.to)}`
      : "Sin fechas";

  const toggleStatus = () => {
    if (!canUpdate) return;
    const next: Task = {
      ...task,
      status: isFinished ? "OPE" : "CLO",
      finishedAt: isFinished ? null : new Date().toISOString(),
    };
    onSave(next, participants);
  };

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

  if (variant === "table") {
    return renderTableVariant({
      task,
      activeParticipants,
      isFinished,
      isDragging,
      canUpdate,
      canDelete,
      canReorder,
      dragDisabled,
      showDeleteConfirm,
      safeRangeLabel,
      isDateOpen,
      setIsDateOpen,
      minDate,
      maxDate,
      toggleStatus,
      handleDateChange,
      onEdit,
      onDelete,
      setShowDeleteConfirm,
      listeners,
      attributes,
      showBlocked,
      setNodeRef,
      style,
    });
  }

  return renderCardVariant({
    task,
    activeParticipants,
    isFinished,
    isDragging,
    canUpdate,
    canDelete,
    canReorder,
    dragDisabled,
    showDeleteConfirm,
    safeRangeLabel,
    isDateOpen,
    setIsDateOpen,
    minDate,
    maxDate,
    toggleStatus,
    handleDateChange,
    onEdit,
    onDelete,
    setShowDeleteConfirm,
    listeners,
    attributes,
    showBlocked,
    setNodeRef,
    style,
  });
}

interface TaskVariantProps {
  task: Task;
  activeParticipants: TaskParticipant[];
  isFinished: boolean;
  isDragging: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canReorder: boolean;
  dragDisabled: boolean;
  showDeleteConfirm: boolean;
  safeRangeLabel: string;
  isDateOpen: boolean;
  setIsDateOpen: (open: boolean) => void;
  minDate: Date | undefined;
  maxDate: Date | undefined;
  toggleStatus: () => void;
  handleDateChange: (r?: DateRange) => void;
  onEdit: () => void;
  onDelete: () => void;
  setShowDeleteConfirm: (show: boolean) => void;
  listeners: any;
  attributes: any;
  showBlocked: () => void;
  setNodeRef: (node: HTMLElement | null) => void;
  style: React.CSSProperties;
}

function renderCardVariant({
  task,
  activeParticipants,
  isFinished,
  isDragging,
  canUpdate,
  canDelete,
  canReorder,
  dragDisabled,
  showDeleteConfirm,
  safeRangeLabel,
  isDateOpen,
  setIsDateOpen,
  minDate,
  maxDate,
  toggleStatus,
  handleDateChange,
  onEdit,
  onDelete,
  setShowDeleteConfirm,
  listeners,
  attributes,
  showBlocked,
  setNodeRef,
  style,
}: TaskVariantProps) {
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-3 p-3 bg-white hover:bg-gray-50 transition-colors ${
        isDragging ? "opacity-50 bg-blue-50" : ""
      }`}
    >
      {canReorder && (
        <div
          className={`flex items-center pt-1 ${
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
          <GripVertical size={16} />
        </div>
      )}

      <div className="pt-1">
        {canUpdate ? (
          <button
            onClick={toggleStatus}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              isFinished
                ? "bg-green-500 border-green-500 text-white"
                : "border-gray-300 hover:border-green-400"
            }`}
          >
            {isFinished && (
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
        ) : (
          <div
            className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
              isFinished
                ? "bg-green-500 border-green-500 text-white"
                : "border-gray-300"
            }`}
          >
            {isFinished && (
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="mb-1">
          <span
            className={`text-sm font-medium ${isFinished ? "text-gray-400 line-through" : "text-gray-800"}`}
          >
            {task.name || "Tarea sin nombre"}
          </span>
        </div>
        <p className="text-xs text-gray-500 line-clamp-1 mb-2">
          {task.result || "Sin entregable definido"}
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            {activeParticipants.length > 0 ? (
              <>
                {activeParticipants.slice(0, 3).map((p) => (
                  <Badge
                    key={p.id}
                    variant="secondary"
                    className={`text-[10px] px-1.5 py-0.5 ${
                      p.positionId
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-purple-50 text-purple-700 border-purple-200"
                    }`}
                  >
                    {p.positionId
                      ? (p.positionName ?? "Cargo")
                      : (p.externalUserName ?? "Externo")}
                  </Badge>
                ))}
                {activeParticipants.length > 3 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600"
                  >
                    +{activeParticipants.length - 3}
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-[10px] text-gray-400">
                Sin responsables
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
              <PopoverTrigger asChild disabled={!canUpdate}>
                <button
                  className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${
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
        </div>
      </div>

      <div className="flex items-center gap-1">
        {canUpdate && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-7 w-7"
          >
            <Edit className="h-3.5 w-3.5 text-gray-500" />
          </Button>
        )}
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteConfirm(true)}
            className="h-7 w-7"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-400 hover:text-red-600" />
          </Button>
        )}
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmModal
          onConfirm={onDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
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
  const [containerWidth, setContainerWidth] = useState(0);
  const badgeWidthRef = useRef<number>(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateLayout = () => {
      const width = el.offsetWidth;
      setContainerWidth(width);

      const badges = el.querySelectorAll("[data-badge]");
      if (badges.length > 0) {
        badgeWidthRef.current = badges[0].offsetWidth + 4;
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

function renderTableVariant({
  task,
  activeParticipants,
  isFinished,
  isDragging,
  canUpdate,
  canDelete,
  canReorder,
  dragDisabled,
  showDeleteConfirm,
  safeRangeLabel,
  isDateOpen,
  setIsDateOpen,
  minDate,
  maxDate,
  toggleStatus,
  handleDateChange,
  onEdit,
  onDelete,
  setShowDeleteConfirm,
  listeners,
  attributes,
  showBlocked,
  setNodeRef,
  style,
}: TaskVariantProps) {
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
          <PopoverTrigger asChild disabled={!canUpdate}>
            <button
              className={`text-[10px] px-1.5 py-0.5 rounded border ${
                canUpdate
                  ? "hover:bg-gray-100 cursor-pointer"
                  : "cursor-default"
              } ${isFinished ? "border-green-200 bg-green-50 text-green-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}
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
            onClick={toggleStatus}
            className={`cursor-pointer text-[10px] ${
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
            className="h-6 w-6"
          >
            <Edit className="h-3 w-3 text-gray-500" />
          </Button>
        )}
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteConfirm(true)}
            className="h-6 w-6"
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

interface TaskTableHeaderProps {
  factorName: string;
  completedTasks: number;
  totalTasks: number;
}

export function TaskTableHeader({
  factorName,
  completedTasks,
  totalTasks,
}: TaskTableHeaderProps) {
  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="bg-blue-50 ">
      <div className="grid grid-cols-[35%_30%_15%_10%_10%]">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
            Tareas
          </span>
        </div>
        <div className="flex items-center px-3 py-2">
          <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
            Responsables
          </span>
        </div>
        <div className="flex items-center justify-center px-3 py-2">
          <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
            Fechas
          </span>
        </div>
        <div className="flex items-center justify-center px-3 py-2">
          <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
            Estado
          </span>
        </div>
        <div className="flex items-center justify-end px-3 py-2">
          <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
            Acciones
          </span>
        </div>
      </div>
    </div>
  );
}
