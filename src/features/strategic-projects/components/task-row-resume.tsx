"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, GripVertical, ListChecks, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/shared/components/date-range-picker";
import { Task } from "../types/types";
import { format } from "date-fns";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { DraggableAttributes } from "@dnd-kit/core";

interface TaskRowResumeProps {
  task: Task;
  onEdit: () => void;
  onRequestDelete: () => void;
  onSave: (task: Task) => void;
  range: DateRange;
  setRange: (range: DateRange) => void;
  formatShortDate: (date?: Date) => string;
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
  listeners,
  attributes,
}: TaskRowResumeProps) {
  const handleDateRangeApply = (newRange: DateRange | undefined) => {
    if (newRange) {
      onSave({
        ...task,
        fechaInicio: format(newRange.from!, "yyyy-MM-dd"),
        fechaFin: format(newRange.to!, "yyyy-MM-dd"),
      });
    }
  };

  return (
    <div className="col-span-12 grid grid-cols-12 gap-2 items-center">
      <div className="col-span-4 flex items-center gap-2">
        <div
          className="cursor-grab text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
          {...(listeners ?? {})}
          {...(attributes ?? {})}
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <ListChecks className="text-green-500 h-4 w-4" />
        <span className="text-sm text-gray-800 truncate">{task.nombre}</span>
      </div>
      <div className="col-span-4">
        <span className="text-sm text-gray-600 truncate">
          {task.entregable}
        </span>
      </div>
      <div className="col-span-2">
        <Badge
          onClick={() => onSave({ ...task, isFinished: !task.isFinished })}
          className={`text-[10px] cursor-pointer ${
            task.isFinished
              ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
              : "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200"
          }`}
        >
          {task.isFinished ? "Terminado" : "En proceso"}
        </Badge>
      </div>
      <div className="col-span-2 flex justify-end items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] px-3 py-1 cursor-pointer text-center">
              {range.from && range.to
                ? `${formatShortDate(range.from)} - ${formatShortDate(
                    range.to
                  )}`
                : "Fechas"}
            </Badge>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="end">
            <DateRangePicker
              date={range}
              onChange={(newRange) => {
                if (newRange) {
                  setRange(newRange);
                  onSave({
                    ...task,
                    fechaInicio: format(newRange.from!, "yyyy-MM-dd"),
                    fechaFin: format(newRange.to!, "yyyy-MM-dd"),
                  });
                }
              }}
              showToastOnApply={false}
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
