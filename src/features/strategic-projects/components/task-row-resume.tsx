"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, GripVertical, ListChecks, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/shared/components/single-date-picker";
import { StrategicProjectStructureTask as Task } from "../types/strategicProjectStructure";
import { isValid } from "date-fns";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { DraggableAttributes } from "@dnd-kit/core";
import { toast } from "sonner";

// Tooltip reutilizado
import { CellWithTooltip } from "@/shared/components/cell-with-tooltip";

// Rango del PROYECTO
import { usePlanRange } from "@/features/strategic-projects/context/plan-range.context";
import { projectRangeToDates, toYmd } from "@/shared/utils/dateFormatters";

interface TaskRowResumeProps {
  task: Task;
  onEdit: () => void;
  onRequestDelete: () => void;
  onSave: (task: Task) => void;
  range: DateRange;
  setRange: (range: DateRange) => void;
  formatShortDate: (date?: Date) => string;
  dragDisabled?: boolean;
  dragDisabledReason?: string;
  listeners?: SyntheticListenerMap;
  attributes?: DraggableAttributes;
}

export function TaskRowResume({
  task,
  onEdit,
  onRequestDelete,
  onSave,
  range,
  setRange,
  formatShortDate,
  dragDisabled = false,
  dragDisabledReason = "",
  listeners,
  attributes,
}: TaskRowResumeProps) {
  const isFinished =
    !!task.finishedAt || (task.status ?? "").toUpperCase() === "CLO";
  const [isDateOpen, setIsDateOpen] = useState(false);

  // Fechas del PROYECTO (via provider)
  const { planFromAt, planUntilAt } = usePlanRange();
  const { min: minDate, max: maxDate } = projectRangeToDates(
    planFromAt,
    planUntilAt
  );

  const toggleStatus = () => {
    const next: Task = {
      ...task,
      status: isFinished ? "OPE" : "CLO",
      finishedAt: isFinished ? null : new Date().toISOString(),
    };
    onSave(next);
  };

  // Bloqueo drag
  const blockedMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info(
      dragDisabledReason ||
        "No puedes reordenar mientras hay cambios sin guardar"
    );
  };
  const blockedPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info(
      dragDisabledReason ||
        "No puedes reordenar mientras hay cambios sin guardar"
    );
  };
  const blockedTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info(
      dragDisabledReason ||
        "No puedes reordenar mientras hay cambios sin guardar"
    );
  };

  const blockedProps: React.HTMLAttributes<HTMLDivElement> = {
    onMouseDown: blockedMouseDown,
    onPointerDown: blockedPointerDown,
    onTouchStart: blockedTouchStart,
  };
  const sortableProps = (!dragDisabled
    ? { ...(listeners ?? {}), ...(attributes ?? {}) }
    : {}) as unknown as React.HTMLAttributes<HTMLDivElement>;

  return (
    <div className="col-span-12 grid grid-cols-12 gap-2 items-center">
      {/* Columna: Nombre (task.name) */}
      <div className="col-span-4 min-w-0">
        <div
          className={`flex items-center gap-2 min-w-0 ${
            dragDisabled ? "cursor-not-allowed opacity-50" : "cursor-grab"
          }`}
          title={
            dragDisabled
              ? dragDisabledReason ||
                "No puedes reordenar mientras hay cambios sin guardar"
              : "Arrastra para reordenar"
          }
          {...(dragDisabled ? blockedProps : sortableProps)}
        >
          <div className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
            <GripVertical className="h-4 w-4" />
          </div>
          <ListChecks className="text-green-500 h-4 w-4" />
          {/* El texto debe poder encogerse → min-w-0 + flex-1 + truncate */}
          <CellWithTooltip
            lines={[{ label: "Acción clave", text: task.name ?? "" }]}
            side="top"
          >
            <span className="flex-1 min-w-0 truncate text-sm text-gray-800">
              {task.name ?? ""}
            </span>
          </CellWithTooltip>
        </div>
      </div>

      {/* Columna: Resultado (task.result) */}
      <div className="col-span-4 min-w-0">
        <CellWithTooltip
          lines={[{ label: "Entregable", text: task.result ?? "" }]}
          side="top"
        >
          {/* block + min-w-0 + truncate para que no se meta debajo del badge */}
          <span className="block min-w-0 truncate text-sm text-gray-600">
            {task.result ?? ""}
          </span>
        </CellWithTooltip>
      </div>

      {/* Estado */}
      <div className="col-span-2">
        <Badge
          onClick={toggleStatus}
          className={`text-[10px] cursor-pointer ${
            isFinished
              ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
              : "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200"
          }`}
        >
          {isFinished ? "Terminado" : "En proceso"}
        </Badge>
      </div>

      {/* Fechas + acciones */}
      <div className="col-span-2 flex justify-end items-center gap-1">
        <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
          <PopoverTrigger asChild>
            <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] px-3 py-1 cursor-pointer text-center">
              {range.from &&
              isValid(range.from) &&
              range.to &&
              isValid(range.to)
                ? `${formatShortDate(range.from)} - ${formatShortDate(
                    range.to
                  )}`
                : "Fechas"}
            </Badge>
          </PopoverTrigger>

          <PopoverContent className="w-auto p-4" align="end">
            <DateRangePicker
              date={range}
              onChange={(newRange) => newRange && setRange(newRange)}
              showToastOnApply={false}
              minDate={minDate}
              maxDate={maxDate}
              onClose={() => setIsDateOpen(false)}
              onApply={(r) => {
                if (!r?.from || !r?.to || !isValid(r.from) || !isValid(r.to))
                  return;
                const next: Task = {
                  ...task,
                  fromAt: toYmd(r.from)!,
                  untilAt: toYmd(r.to)!,
                };
                onSave(next);
                setRange({ from: r.from, to: r.to });
              }}
            />
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Edit className="h-4 w-4 text-gray-500 hover:text-gray-700" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onRequestDelete}>
          <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
        </Button>
      </div>
    </div>
  );
}
