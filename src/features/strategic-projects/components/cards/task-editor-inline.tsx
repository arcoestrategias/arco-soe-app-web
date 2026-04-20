"use client";

import { useState, useEffect } from "react";
import { format, isValid } from "date-fns";
import { DateRange } from "react-day-picker";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TextareaWithCounter } from "@/shared/components/textarea-with-counter";
import { CurrencyInput } from "@/shared/components/currency-input";
import { DateRangePicker } from "@/shared/components/single-date-picker";
import { TaskParticipantsSelector } from "../task-participants-selector";
import {
  StrategicProjectStructureTask as Task,
  TaskParticipant,
} from "../../types/strategicProjectStructure";
import { parseYmdOrIsoToLocalDate, toYmd } from "@/shared/utils/dateFormatters";

interface TaskEditorInlineProps {
  task: Task;
  participants: TaskParticipant[];
  onSave: (task: Task, participants: TaskParticipant[]) => void;
  onCancel: () => void;
  businessUnitId?: string;
}

export function TaskEditorInline({
  task,
  participants,
  onSave,
  onCancel,
  businessUnitId,
}: TaskEditorInlineProps) {
  const [editedTask, setEditedTask] = useState<Task>({ ...task });
  const [editedParticipants, setEditedParticipants] = useState<
    TaskParticipant[]
  >([...participants]);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Task, string>>>({});

  const [range, setRange] = useState<DateRange>({
    from: parseYmdOrIsoToLocalDate(task.fromAt),
    to: parseYmdOrIsoToLocalDate(task.untilAt),
  });

  useEffect(() => {
    setEditedTask({ ...task });
    setEditedParticipants([...participants]);
    setRange({
      from: parseYmdOrIsoToLocalDate(task.fromAt),
      to: parseYmdOrIsoToLocalDate(task.untilAt),
    });
  }, [task, participants]);

  const handleChange = (field: keyof Task, value: unknown) =>
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
    if (!(editedTask.result || "").toString().trim())
      newErrors.result = "Campo obligatorio";
    if (!editedTask.fromAt || !editedTask.untilAt)
      newErrors.fromAt = "Selecciona un rango de fechas";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(editedTask, editedParticipants);
  };

  const safeRangeLabel =
    range.from && isValid(range.from) && range.to && isValid(range.to)
      ? `${format(range.from, "dd/MM/yyyy")} - ${format(
          range.to,
          "dd/MM/yyyy",
        )}`
      : "";

  const activeParticipants = editedParticipants.filter((p) => p.isActive);

  return (
    <div className="p-4 bg-white border-l-4 border-orange-400">
      <h4 className="text-xs font-semibold text-gray-500 mb-3">
        {task.id.startsWith("__new__") ? "Nueva tarea" : "Editando tarea"}
      </h4>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Acción clave <span className="text-red-500">*</span>
          </label>
          <TextareaWithCounter
            value={editedTask.name ?? ""}
            onValueChange={(val) => handleChange("name", val)}
            maxLength={500}
            className="min-h-[60px]"
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1">{errors.name}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Entregable <span className="text-red-500">*</span>
          </label>
          <TextareaWithCounter
            value={editedTask.result ?? ""}
            onValueChange={(val) => handleChange("result", val)}
            maxLength={1000}
            className="min-h-[60px]"
          />
          {errors.result && (
            <p className="text-xs text-red-500 mt-1">{errors.result}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Fechas <span className="text-red-500">*</span>
          </label>
          <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
            <PopoverTrigger asChild>
              <input
                readOnly
                value={safeRangeLabel}
                className="h-8 text-sm w-full rounded-md border border-input px-3 bg-white"
                placeholder="Seleccionar"
              />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <DateRangePicker
                date={range}
                onChange={(newRange) => newRange && setRange(newRange)}
                showToastOnApply={false}
                onClose={() => setIsDatePopoverOpen(false)}
                onApply={handleApplyDates}
              />
            </PopoverContent>
          </Popover>
          {errors.fromAt && (
            <p className="text-xs text-red-500 mt-1">{errors.fromAt}</p>
          )}
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Estado</label>
          <select
            value={editedTask.status ?? ""}
            onChange={(e) => handleChange("status", e.target.value)}
            className="h-8 text-sm w-full rounded-md border border-input px-3 bg-white"
          >
            <option value="">Seleccionar</option>
            <option value="OPE">En proceso</option>
            <option value="CLO">Terminado</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Responsables
          </label>
          <TaskParticipantsSelector
            participants={editedParticipants}
            onParticipantsChange={setEditedParticipants}
            businessUnitId={businessUnitId}
          />
        </div>
      </div>

      {activeParticipants.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-1">
          <span className="text-xs text-gray-500 mr-2">Asignados:</span>
          {activeParticipants.map((p) => (
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
              <button
                className="ml-1 hover:text-red-600"
                onClick={() =>
                  setEditedParticipants((prev) =>
                    prev.filter((x) => x.id !== p.id),
                  )
                }
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <div className="mb-3 text-xs text-gray-400">
          Sin responsables asignados
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowMoreInfo(!showMoreInfo)}
        className="text-xs text-blue-600 hover:text-blue-700 mb-3"
      >
        {showMoreInfo ? "- Menos información" : "+ Más información"}
      </button>

      {showMoreInfo && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Limitación
            </label>
            <TextareaWithCounter
              value={editedTask.limitation ?? ""}
              onValueChange={(val) => handleChange("limitation", val)}
              maxLength={1000}
              className="min-h-[40px]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Metodología
            </label>
            <TextareaWithCounter
              value={editedTask.methodology ?? ""}
              onValueChange={(val) => handleChange("methodology", val)}
              maxLength={1000}
              className="min-h-[40px]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Comentarios
            </label>
            <TextareaWithCounter
              value={editedTask.comments ?? ""}
              onValueChange={(val) => handleChange("comments", val)}
              maxLength={1000}
              className="min-h-[40px]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Inversión
            </label>
            <CurrencyInput
              value={Number(editedTask.budget ?? 0)}
              onChange={(val) => handleChange("budget", val)}
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="h-8 text-xs"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          size="sm"
          className="h-8 text-xs bg-orange-500 hover:bg-orange-600"
        >
          {task.id.startsWith("__new__") ? "Crear" : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
