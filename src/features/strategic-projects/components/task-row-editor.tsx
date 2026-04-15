"use client";

import { useRef, useState } from "react";
import { format, isValid } from "date-fns";
import { DateRange } from "react-day-picker";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import {
  StrategicProjectStructureTask as Task,
  TaskParticipant,
} from "../types/strategicProjectStructure";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { CurrencyInput } from "@/shared/components/currency-input";
import { DateRangePicker } from "@/shared/components/single-date-picker";
import { TextareaWithCounter } from "@/shared/components/textarea-with-counter";
import { TaskParticipantsSelector } from "./task-participants-selector";

import { parseYmdOrIsoToLocalDate, toYmd } from "@/shared/utils/dateFormatters";

export function TaskRowEditor({
  task,
  participants,
  onSave,
  onCancel,
  businessUnitId,
}: {
  task: Task;
  participants: TaskParticipant[];
  onSave: (task: Task, participants: TaskParticipant[]) => void;
  onCancel: () => void;
  businessUnitId?: string;
}) {
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const limitationRef = useRef<HTMLTextAreaElement>(null);
  const methodologyRef = useRef<HTMLTextAreaElement>(null);
  const propsRef = useRef<HTMLTextAreaElement>(null);
  const budgetRef = useRef<HTMLInputElement>(null);
  const datesRef = useRef<HTMLInputElement>(null);
  const commentsRef = useRef<HTMLTextAreaElement>(null);

  const [editedTask, setEditedTask] = useState<Task>({ ...task });
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [editedParticipants, setEditedParticipants] = useState<TaskParticipant[]>([...participants]);
  const [showMoreInfo, setShowMoreInfo] = useState(false);

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
          "dd/MM/yyyy"
        )}`
      : "";

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-500 mb-2">
        {task.id.startsWith("__new__") ? "Nueva tarea" : "Editando tarea"}
      </h3>

      {/* Fila 1: Acción clave (completa) */}
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

      {/* Fila 2: Justificación y Entregable (2 columnas) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Justificación
          </label>
          <TextareaWithCounter
            ref={descriptionRef}
            value={editedTask.description ?? ""}
            onValueChange={(val) => handleChange("description", val)}
            maxLength={1000}
            className="min-h-[60px]"
          />
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

      {/* Fila 3: Fechas, Estado, Responsables (3 columnas) */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Fechas <span className="text-red-500">*</span>
          </label>
          <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
            <PopoverTrigger asChild>
              <input
                ref={datesRef}
                readOnly
                value={safeRangeLabel}
                className="h-9 text-sm w-full rounded-md border border-input px-3 bg-white"
                placeholder="Seleccionar fechas"
              />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <DateRangePicker
                date={range}
                onChange={(newRange) => newRange && setRange(newRange)}
                showToastOnApply={false}
                onClose={() => setIsDatePopoverOpen(false)}
                onApply={(r) => handleApplyDates(r)}
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
            className="h-9 text-sm w-full rounded-md border border-input px-3 bg-white"
          >
            <option value="">Seleccionar</option>
            <option value="OPE">En proceso</option>
            <option value="CLO">Terminado</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Responsables</label>
          <TaskParticipantsSelector
            participants={editedParticipants}
            onParticipantsChange={setEditedParticipants}
            businessUnitId={businessUnitId}
          />
        </div>
      </div>

      {/* Fila 4: Responsables asignados */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">
          Responsables asignados
        </label>
        {editedParticipants.filter((p) => p.isActive).length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-1">
            {editedParticipants
              .filter((p) => p.isActive && p.positionId)
              .map((p) => (
                <Badge
                  key={p.id}
                  variant="secondary"
                  className="pl-2 pr-1 py-1 flex items-center gap-1.5 bg-blue-50 text-blue-700 border-blue-200 text-xs"
                >
                  <span>{p.positionName ?? "Cargo sin nombre"}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-blue-100"
                    onClick={() =>
                      setEditedParticipants((prev) =>
                        prev.filter((x) => x.id !== p.id)
                      )
                    }
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            {editedParticipants
              .filter((p) => p.isActive && p.externalUserId)
              .map((p) => (
                <Badge
                  key={p.id}
                  variant="secondary"
                  className="pl-2 pr-1 py-1 flex items-center gap-1.5 bg-purple-50 text-purple-700 border-purple-200 text-xs"
                >
                  <span>{p.externalUserName ?? "Externo sin nombre"}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-purple-100"
                    onClick={() =>
                      setEditedParticipants((prev) =>
                        prev.filter((x) => x.id !== p.id)
                      )
                    }
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 mt-1">Sin responsables asignados</p>
        )}
      </div>

      {/* Sección colapsable: Más información */}
      <div className="border rounded-md">
        <button
          type="button"
          onClick={() => setShowMoreInfo(!showMoreInfo)}
          className="w-full px-4 py-2 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span className="font-medium">Más información (opcional)</span>
          {showMoreInfo ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {showMoreInfo && (
          <div className="px-4 pb-4 border-t pt-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Limitación
                </label>
                <TextareaWithCounter
                  ref={limitationRef}
                  value={editedTask.limitation ?? ""}
                  onValueChange={(val) => handleChange("limitation", val)}
                  maxLength={1000}
                  className="min-h-[50px]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Metodología
                </label>
                <TextareaWithCounter
                  ref={methodologyRef}
                  value={editedTask.methodology ?? ""}
                  onValueChange={(val) => handleChange("methodology", val)}
                  maxLength={1000}
                  className="min-h-[50px]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Comentarios
                </label>
                <TextareaWithCounter
                  ref={commentsRef}
                  value={editedTask.comments ?? ""}
                  onValueChange={(val) => handleChange("comments", val)}
                  maxLength={1000}
                  className="min-h-[50px]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Apoyos Requeridos
                </label>
                <TextareaWithCounter
                  ref={propsRef}
                  value={editedTask.props ?? ""}
                  onValueChange={(val) => handleChange("props", val)}
                  maxLength={1000}
                  className="min-h-[50px]"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs text-gray-500 mb-1 block">
                Inversión
              </label>
              <CurrencyInput
                ref={budgetRef}
                value={Number(editedTask.budget ?? 0)}
                onChange={(val) => handleChange("budget", val)}
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-2 justify-end pt-2">
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
          {task.id.startsWith("__new__") ? "Crear" : "Actualizar"}
        </Button>
      </div>
    </div>
  );
}
