"use client";

import { useRef, useState } from "react";
import { format, isValid } from "date-fns";
import { DateRange } from "react-day-picker";
import { StrategicProjectStructureTask as Task } from "../types/strategicProjectStructure";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { CurrencyInput } from "@/shared/components/currency-input";
import { DateRangePicker } from "@/shared/components/single-date-picker";
import { TextareaWithCounter } from "@/shared/components/textarea-with-counter";

// Rango del PROYECTO via provider
import { usePlanRange } from "@/features/strategic-projects/context/plan-range.context";
import {
  parseYmdOrIsoToLocalDate,
  projectRangeToDates,
  toYmd,
} from "@/shared/utils/dateFormatters";

export function TaskRowEditor({
  task,
  onSave,
  onCancel,
}: {
  task: Task;
  onSave: (task: Task) => void;
  onCancel: () => void;
}) {
  const nameRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLTextAreaElement>(null);
  const limitationRef = useRef<HTMLTextAreaElement>(null);
  const methodologyRef = useRef<HTMLTextAreaElement>(null);
  const budgetRef = useRef<HTMLInputElement>(null);
  const datesRef = useRef<HTMLInputElement>(null);
  const commentsRef = useRef<HTMLTextAreaElement>(null);

  const { planFromAt, planUntilAt } = usePlanRange();
  const { min: minDate, max: maxDate } = projectRangeToDates(
    planFromAt,
    planUntilAt
  );

  const [editedTask, setEditedTask] = useState<Task>({ ...task });
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  const [range, setRange] = useState<DateRange>({
    from: parseYmdOrIsoToLocalDate(task.fromAt),
    to: parseYmdOrIsoToLocalDate(task.untilAt),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Task, string>>>({});

  const handleChange = (field: keyof Task, value: any) =>
    setEditedTask((prev) => ({ ...prev, [field]: value }));

  const handleApplyDates = (r?: DateRange) => {
    if (!r?.from || !r?.to || !isValid(r.from) || !isValid(r.to)) return;
    setRange(r);
    setEditedTask((prev) => ({
      ...prev,
      fromAt: toYmd(r.from)!,
      untilAt: toYmd(r.to)!,
    }));
  };

  const handleSave = () => {
    const newErrors: Partial<Record<keyof Task, string>> = {};
    if (!editedTask.name?.trim()) newErrors.name = "Campo obligatorio";
    if (
      !((editedTask.description ?? editedTask.result) || "").toString().trim()
    )
      newErrors.description = "Campo obligatorio";
    if (!editedTask.fromAt || !editedTask.untilAt)
      newErrors.fromAt = "Selecciona un rango de fechas";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(editedTask);
  };

  const safeRangeLabel =
    range.from && isValid(range.from) && range.to && isValid(range.to)
      ? `${format(range.from, "dd/MM/yyyy")} - ${format(
          range.to,
          "dd/MM/yyyy"
        )}`
      : "";

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-500 mb-2">
        Editando tarea
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Nombre</label>
          <TextareaWithCounter
            value={editedTask.name ?? ""}
            onChange={(val) => handleChange("name", val)}
            maxLength={120}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                resultRef.current?.focus();
              }
            }}
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1">{errors.name}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Resultado / Descripción
          </label>
          <TextareaWithCounter
            ref={resultRef}
            value={editedTask.description ?? editedTask.result ?? ""}
            onChange={(val) => handleChange("description", val)}
            maxLength={300}
          />
          {errors.description && (
            <p className="text-xs text-red-500 mt-1">{errors.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Limitación</label>
          <TextareaWithCounter
            ref={limitationRef}
            value={editedTask.limitation ?? ""}
            onChange={(val) => handleChange("limitation", val)}
            maxLength={120}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Metodología
          </label>
          <TextareaWithCounter
            ref={methodologyRef}
            value={editedTask.methodology ?? ""}
            onChange={(val) => handleChange("methodology", val)}
            maxLength={120}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Inversión</label>
          <CurrencyInput
            ref={budgetRef}
            value={Number(editedTask.budget ?? 0)}
            onChange={(val) => handleChange("budget", val)}
            className="h-8 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Estado</label>
          <select
            value={editedTask.status ?? ""}
            onChange={(e) => handleChange("status", e.target.value)}
            className="h-8 text-sm w-full rounded border px-3"
          >
            <option value="">Seleccionar</option>
            <option value="OPE">En proceso</option>
            <option value="CLO">Terminado</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Fechas</label>
          <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
            <PopoverTrigger asChild>
              <input
                ref={datesRef}
                readOnly
                value={safeRangeLabel}
                className="h-8 text-sm w-full rounded border px-3"
              />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <DateRangePicker
                date={range}
                onChange={(newRange) => newRange && setRange(newRange)} // no persiste aquí
                showToastOnApply={false}
                minDate={minDate}
                maxDate={maxDate}
                onClose={() => setIsDatePopoverOpen(false)}
                onApply={(r) => handleApplyDates(r)} // 1 sola persistencia
              />
            </PopoverContent>
          </Popover>
          {errors.fromAt && (
            <p className="text-xs text-red-500 mt-1">{errors.fromAt}</p>
          )}
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Comentarios</label>
        <TextareaWithCounter
          ref={commentsRef}
          value={editedTask.comments ?? ""}
          onChange={(val) => handleChange("comments", val)}
          maxLength={300}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          onClick={onCancel}
          className="text-sm border border-gray-300 text-gray-700"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          className="text-sm bg-orange-500 text-white hover:bg-orange-600"
        >
          Actualizar
        </Button>
      </div>
    </div>
  );
}
