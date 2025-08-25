"use client";

import { useRef, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";

import { Task } from "../types/types";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CurrencyInput } from "@/shared/components/currency-input";
import { DateRangePicker } from "@/shared/components/date-range-picker";
import { TextareaWithCounter } from "@/shared/components/textarea-with-counter";
import { formatDateRange } from "@/shared/utils";

const responsables = [
  "Juan Pérez",
  "María López",
  "Carlos Gómez",
  "Ana Martínez",
];

export function TaskRowEditor({
  task,
  onSave,
  onCancel,
}: {
  task: Task;
  onSave: (task: Task) => void;
  onCancel: () => void;
}) {
  // Refs
  const entregableRef = useRef<HTMLTextAreaElement>(null);
  const limitacionRef = useRef<HTMLTextAreaElement>(null);
  const metodologiaRef = useRef<HTMLTextAreaElement>(null);
  const responsableRef = useRef<HTMLButtonElement>(null);
  const inversionRef = useRef<HTMLInputElement>(null);
  const estadoRef = useRef<HTMLButtonElement>(null);
  const fechasRef = useRef<HTMLInputElement>(null);
  const justificacionRef = useRef<HTMLTextAreaElement>(null);
  const observacionRef = useRef<HTMLTextAreaElement>(null);
  const apoyosRef = useRef<HTMLTextAreaElement>(null);

  // Estados
  const [editedTask, setEditedTask] = useState<Task>({ ...task });
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [range, setRange] = useState<DateRange>({
    from: task.fechaInicio ? new Date(task.fechaInicio) : undefined,
    to: task.fechaFin ? new Date(task.fechaFin) : undefined,
  });
  const [errors, setErrors] = useState<{ [key in keyof Task]?: string }>({});

  // Handlers
  const handleChange = (field: keyof Task, value: any) => {
    setEditedTask((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const newErrors: typeof errors = {};

    if (!editedTask.nombre?.trim()) newErrors.nombre = "Campo obligatorio";
    if (!editedTask.entregable?.trim())
      newErrors.entregable = "Campo obligatorio";
    if (!editedTask.responsable?.trim())
      newErrors.responsable = "Campo obligatorio";
    if (!editedTask.limitacion?.trim())
      newErrors.limitacion = "Campo obligatorio";
    if (!editedTask.metodologia?.trim())
      newErrors.metodologia = "Campo obligatorio";
    if (!editedTask.justificacion?.trim())
      newErrors.justificacion = "Campo obligatorio";
    if (!editedTask.observacion?.trim())
      newErrors.observacion = "Campo obligatorio";
    if (!editedTask.apoyos || editedTask.apoyos.length === 0)
      newErrors.apoyos = "Campo obligatorio";
    if (!range.from || !range.to)
      newErrors.fechaInicio = "Selecciona un rango de fechas";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const updated = {
      ...editedTask,
      fechaInicio: range.from ? format(range.from, "yyyy-MM-dd") : "",
      fechaFin: range.to ? format(range.to, "yyyy-MM-dd") : "",
    };

    onSave(updated);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-500 mb-2">
        Editando tarea
      </h3>

      {/* Nombre y Entregable */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Nombre</label>
          <TextareaWithCounter
            value={editedTask.nombre}
            onChange={(val) => handleChange("nombre", val)}
            maxLength={120}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                entregableRef.current?.focus();
              }
            }}
          />
          {errors.nombre && (
            <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Entregable</label>
          <TextareaWithCounter
            ref={entregableRef}
            value={editedTask.entregable}
            onChange={(val) => handleChange("entregable", val)}
            maxLength={120}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                limitacionRef.current?.focus();
              }
            }}
          />
          {errors.entregable && (
            <p className="text-xs text-red-500 mt-1">{errors.entregable}</p>
          )}
        </div>
      </div>

      {/* Limitación y Metodología */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Limitación</label>
          <TextareaWithCounter
            ref={limitacionRef}
            value={editedTask.limitacion}
            onChange={(val) => handleChange("limitacion", val)}
            maxLength={120}
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                metodologiaRef.current?.focus();
              }
            }}
          />
          {errors.limitacion && (
            <p className="text-xs text-red-500 mt-1">{errors.limitacion}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Metodología
          </label>
          <TextareaWithCounter
            ref={metodologiaRef}
            value={editedTask.metodologia ?? ""}
            onChange={(val) => handleChange("metodologia", val)}
            maxLength={120}
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                inversionRef.current?.focus();
              }
            }}
          />
          {errors.metodologia && (
            <p className="text-xs text-red-500 mt-1">{errors.metodologia}</p>
          )}
        </div>
      </div>

      {/* Inversión, Responsable, Estado, Fechas */}
      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Inversión</label>
          <CurrencyInput
            ref={inversionRef}
            value={editedTask.inversion ?? 0}
            onChange={(val) => handleChange("inversion", val)}
            className="h-8 text-sm"
            nextRef={responsableRef as React.RefObject<HTMLElement>}
          />
          {errors.inversion && (
            <p className="text-xs text-red-500 mt-1">{errors.inversion}</p>
          )}
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Responsable
          </label>
          <Select
            value={editedTask.responsable}
            onValueChange={(value) => {
              handleChange("responsable", value);
              setTimeout(() => estadoRef.current?.focus(), 50);
            }}
          >
            <SelectTrigger ref={responsableRef} className="h-8 text-sm w-full">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {responsables.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Estado</label>
          <Select
            value={editedTask.isFinished ? "true" : "false"}
            onValueChange={(value) => {
              handleChange("isFinished", value === "true");
              setTimeout(() => fechasRef.current?.focus(), 50);
            }}
          >
            <SelectTrigger ref={estadoRef} className="h-8 text-sm w-full">
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Terminado</SelectItem>
              <SelectItem value="false">En proceso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Fechas</label>
          <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
            <PopoverTrigger asChild>
              <input
                ref={fechasRef}
                readOnly
                value={formatDateRange(range.from, range.to)}
                className="h-8 text-sm w-full rounded border px-3"
              />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <DateRangePicker
                date={range}
                onChange={(newRange) => {
                  if (newRange) setRange(newRange);
                }}
                showToastOnApply={false}
                onClose={() => setIsDatePopoverOpen(false)}
                onAfterApply={() => {
                  setTimeout(() => justificacionRef.current?.focus(), 50);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Justificación, Observación, Apoyos, Acciones */}
      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Justificación
          </label>
          <TextareaWithCounter
            ref={justificacionRef}
            value={editedTask.justificacion}
            onChange={(val) => handleChange("justificacion", val)}
            maxLength={300}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                observacionRef.current?.focus();
              }
            }}
          />
          {errors.justificacion && (
            <p className="text-xs text-red-500 mt-1">{errors.justificacion}</p>
          )}
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Observación
          </label>
          <TextareaWithCounter
            ref={observacionRef}
            value={editedTask.observacion}
            onChange={(val) => handleChange("observacion", val)}
            maxLength={300}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                apoyosRef.current?.focus();
              }
            }}
          />
          {errors.observacion && (
            <p className="text-xs text-red-500 mt-1">{errors.observacion}</p>
          )}
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Apoyos</label>
          <TextareaWithCounter
            ref={apoyosRef}
            value={editedTask.apoyos?.join(", ") ?? ""}
            onChange={(val) =>
              handleChange(
                "apoyos",
                val
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
            maxLength={300}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
            }}
          />
          {errors.apoyos && (
            <p className="text-xs text-red-500 mt-1">{errors.apoyos}</p>
          )}
        </div>

        <div className="flex flex-col justify-end items-end gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="text-sm border border-gray-300 text-gray-700 w-full"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="text-sm bg-orange-500 text-white hover:bg-orange-600 w-full"
          >
            Actualizar
          </Button>
        </div>
      </div>
    </div>
  );
}
