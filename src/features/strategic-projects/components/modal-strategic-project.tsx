"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { SingleDatePicker } from "@/shared/components/single-date-picker";
import { TextareaWithCounter } from "@/shared/components/textarea-with-counter";
import ObjectiveSelect from "@/shared/components/objective-select";
import { UploadFilesModal } from "@/shared/components/upload-files-modal";
import * as FiltersStorage from "@/shared/filters/storage";
import { toast } from "sonner";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// -------------------- Tipos --------------------
export type ModalMode = "crear" | "editar" | "ver";

export type StrategicProjectFormValues = {
  name: string;
  description?: string | null;
  objectiveId?: string | null;
  fromAt?: string; // YYYY-MM-DD
  untilAt?: string; // YYYY-MM-DD
  budget?: number | null;
  status?: "OPE" | "IPR" | "CLO" | null;
};

export type ModalStrategicProjectProps = {
  isOpen: boolean;
  modo: ModalMode;
  projectId?: string | null;
  strategicPlanId?: string;
  positionId?: string;
  initial?: Partial<StrategicProjectFormValues>;
  onClose: () => void;
  onSave: (result: {
    mode: Exclude<ModalMode, "ver">;
    id?: string;
    payload: {
      name: string;
      description?: string | null;
      fromAt?: string;
      untilAt?: string;
      order?: number | null;
      strategicPlanId: string;
      objectiveId?: string | null;
      positionId: string;
      budget?: number | null;
      status?: "OPE" | "IPR" | "CLO" | null;
    };
  }) => void;
};

// -------------------- Utils simples (sin TZ raros) --------------------
const parseYmdOrIso = (s?: string | null) => {
  if (!s) return undefined;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]); // local (evita -1 día)
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
};
const toYmd = (d?: Date) =>
  d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}`
    : undefined;

const fmtShort = new Intl.DateTimeFormat("es-EC"); // local

function formatCurrencyDisplay(n?: number | null) {
  if (n === null || n === undefined || Number.isNaN(n)) return "";
  try {
    return new Intl.NumberFormat("es-EC", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return Number(n).toFixed(2);
  }
}
function parseCurrencyInput(text: string): number | null {
  if (!text) return null;
  const sanitized = text.replace(/[^\d.,-]/g, "").replace(",", ".");
  const val = Number.parseFloat(sanitized);
  return Number.isFinite(val) ? val : null;
}

// -------------------- Componente --------------------
export function ModalStrategicProject({
  isOpen,
  modo,
  projectId,
  strategicPlanId,
  positionId,
  initial,
  onClose,
  onSave,
}: ModalStrategicProjectProps) {
  const readOnly = modo === "ver";
  const resolvedPlanId = strategicPlanId ?? FiltersStorage.getSelectedPlanId();
  const resolvedPositionId =
    positionId ?? FiltersStorage.getSelectedPositionId();

  // RHF
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<StrategicProjectFormValues>({
    mode: "onTouched",
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      objectiveId: initial?.objectiveId ?? null,
      fromAt: initial?.fromAt ?? undefined,
      untilAt: initial?.untilAt ?? undefined,
      budget: initial?.budget ?? null,
      status: initial?.status ?? "OPE",
    },
  });

  // Estados para los popovers de fecha
  const [isFromOpen, setIsFromOpen] = useState(false);
  const [isUntilOpen, setIsUntilOpen] = useState(false);

  // Rehidrata SOLO al abrir/cambiar initial
  useEffect(() => {
    if (!isOpen) return;

    const defaults: StrategicProjectFormValues = {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      objectiveId: initial?.objectiveId ?? null,
      fromAt: initial?.fromAt ?? undefined,
      untilAt: initial?.untilAt ?? undefined,
      budget: initial?.budget ?? null,
      status: initial?.status ?? "OPE",
    };

    reset(defaults, { keepDirty: false });
  }, [isOpen, initial, reset]);

  // Registrar validación para budget
  useEffect(() => {
    register("budget", {
      min: { value: 0, message: "El presupuesto no puede ser negativo" },
    });
  }, [register]);

  // Budget con máscara
  const [budgetDisplay, setBudgetDisplay] = useState<string>(
    formatCurrencyDisplay(initial?.budget ?? null),
  );
  useEffect(() => {
    setBudgetDisplay(formatCurrencyDisplay(initial?.budget ?? null));
  }, [isOpen, initial]);

  const onBudgetChange = (txt: string) => {
    setBudgetDisplay(txt);
    const n = parseCurrencyInput(txt);
    setValue("budget", n, { shouldDirty: true, shouldValidate: true });
  };
  const onBudgetBlur = () => {
    const n = parseCurrencyInput(budgetDisplay);
    setBudgetDisplay(formatCurrencyDisplay(n));
    setValue("budget", n, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  // Mostrar SIEMPRE lo que hay en el form (no el state del picker)
  const watchFrom = watch("fromAt");
  const watchUntil = watch("untilAt");
  const dFrom = parseYmdOrIso(watchFrom);
  const dTo = parseYmdOrIso(watchUntil);

  // Submit
  const submit = (values: StrategicProjectFormValues) => {
    if (modo === "ver") return;
    if (!resolvedPlanId || !resolvedPositionId) {
      toast.error("No se encuentra el plan o la posición en filtros.");
      return;
    }

    const nameTrim = (values.name ?? "").trim();
    if (nameTrim.length < 3) {
      toast.error("El nombre debe tener mínimo 3 caracteres.");
      return;
    }
    if (nameTrim.length > 500) {
      toast.error("El nombre no puede exceder 500 caracteres.");
      return;
    }
    const desc = (values.description ?? "")?.trim();
    if (desc && desc.length > 1000) {
      toast.error("La descripción no puede exceder 1000 caracteres.");
      return;
    }

    if (values.status === "CLO" && !values.untilAt) {
      toast.error("La fecha de fin es obligatoria si el estado es Cerrado.");
      return;
    }

    // ✅ Sin límite de fechas: solo comprobamos coherencia del rango
    const f = parseYmdOrIso(values.fromAt);
    const u = parseYmdOrIso(values.untilAt);
    if (f && u && f > u) {
      toast.error("La fecha de inicio no puede ser mayor que la fecha de fin.");
      return;
    }

    const payload = {
      name: nameTrim,
      description: desc || undefined,
      fromAt: values.fromAt || undefined,
      untilAt: values.untilAt || undefined,
      order: null,
      strategicPlanId: resolvedPlanId,
      objectiveId: values.objectiveId ?? null,
      positionId: resolvedPositionId,
      budget: values.budget ?? null,
      status: values.status ?? "OPE",
    };

    if (modo === "crear") {
      onSave({ mode: "crear", payload });
    } else {
      onSave({ mode: "editar", id: projectId ?? undefined, payload });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {modo === "crear"
              ? "Nuevo Proyecto Estratégico"
              : modo === "editar"
                ? "Editar Proyecto Estratégico"
                : "Detalle del Proyecto"}
          </DialogTitle>
          <DialogDescription>
            {modo === "crear"
              ? "Completa los datos para registrar un proyecto."
              : modo === "editar"
                ? "Actualiza los datos del proyecto."
                : "Consulta la información del proyecto."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(submit)}
          className="grid grid-cols-1 md:grid-cols-12 gap-4"
        >
          {/* Nombre */}
          <div className="space-y-2 md:col-span-12">
            <Label>Nombre *</Label>
            <Controller
              name="name"
              control={control}
              rules={{
                required: "El nombre es obligatorio",
                minLength: { value: 3, message: "Mínimo 3 caracteres" },
                maxLength: { value: 500, message: "Máximo 500 caracteres" },
              }}
              render={({ field }) => (
                <TextareaWithCounter
                  value={field.value || ""}
                  onChange={field.onChange}
                  maxLength={500}
                  rows={3}
                  // disabled={readOnly}
                />
              )}
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Propósito */}
          <div className="space-y-2 md:col-span-12">
            <Label>Propósito</Label>
            <Controller
              name="description"
              control={control}
              rules={{
                maxLength: { value: 1000, message: "Máximo 1000 caracteres" },
              }}
              render={({ field }) => (
                <TextareaWithCounter
                  value={field.value || ""}
                  onChange={field.onChange}
                  maxLength={1000}
                  rows={5}
                  // disabled={readOnly}
                />
              )}
            />
            {errors.description && (
              <p className="text-xs text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Meta estratégica (objetivo) */}
          <div className="space-y-2 md:col-span-8">
            <Label>Meta Estratégica</Label>
            <Controller
              name="objectiveId"
              control={control}
              render={({ field }) => (
                <ObjectiveSelect
                  planId={resolvedPlanId ?? undefined}
                  positionId={resolvedPositionId ?? undefined}
                  year={new Date().getFullYear()}
                  value={field.value ?? undefined}
                  onChange={(v) => field.onChange(v ?? null)}
                  hideSwitch
                  stacked
                  triggerClassName="w-full"
                  disabled={readOnly}
                />
              )}
            />
          </div>

          {/* Presupuesto total */}
          <div className="space-y-2 md:col-span-4">
            <Label>Presupuesto Total</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <Input
                inputMode="decimal"
                placeholder="0,00"
                value={budgetDisplay}
                onChange={(e) => onBudgetChange(e.target.value)}
                onBlur={onBudgetBlur}
                disabled={readOnly}
                className={cn(
                  "pl-7",
                  errors.budget && "border-red-500 focus-visible:ring-red-500",
                )}
              />
            </div>
            {errors.budget && (
              <p className="text-xs text-red-600">{errors.budget.message}</p>
            )}
          </div>

          {/* Fila: Fecha Desde, Fecha Hasta, Estado */}
          <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              {/* Fecha Inicio */}
              <Label>Desde</Label>
              <Popover open={isFromOpen} onOpenChange={setIsFromOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dFrom && "text-muted-foreground",
                    )}
                    disabled={readOnly}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dFrom ? fmtShort.format(dFrom) : "Fecha inicio"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <SingleDatePicker
                    date={dFrom}
                    onClose={() => setIsFromOpen(false)}
                    onApply={(d) => {
                      setValue("fromAt", toYmd(d), { shouldDirty: true });
                      // Si la fecha fin es menor a la nueva fecha inicio, limpiarla
                      if (dTo && d && d > dTo) {
                        setValue("untilAt", undefined, { shouldDirty: true });
                      }
                      // Abrir automáticamente fecha fin si se seleccionó fecha inicio
                      if (d) {
                        setIsUntilOpen(true);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              {/* Fecha Fin */}
              <Label>Hasta</Label>
              <Popover open={isUntilOpen} onOpenChange={setIsUntilOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dTo && "text-muted-foreground",
                    )}
                    disabled={readOnly || !dFrom}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dTo ? fmtShort.format(dTo) : "Fecha fin"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <SingleDatePicker
                    date={dTo}
                    minDate={dFrom}
                    disabled={!dFrom}
                    onClose={() => setIsUntilOpen(false)}
                    onApply={(d) => {
                      setValue("untilAt", toYmd(d), { shouldDirty: true });
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label>Estado</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? "OPE"}
                    onValueChange={field.onChange}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPE">Abierto</SelectItem>
                      <SelectItem value="IPR">En progreso</SelectItem>
                      <SelectItem value="CLO">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <DialogFooter className="md:col-span-12 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {readOnly ? "Cerrar" : "Cancelar"}
            </Button>
            {!readOnly && (
              <Button
                type="submit"
                className="btn-gradient"
                disabled={isSubmitting || (modo === "editar" && !isDirty)}
              >
                {modo === "crear" ? "Registrar" : "Actualizar"}
              </Button>
            )}

            {/* Subir documentos: solo en edición */}
            {modo !== "crear" && projectId && (
              <UploadDocsForProject projectId={projectId} />
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Botón + modal de documentos (solo en editar)
function UploadDocsForProject({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Documentos
      </Button>
      <UploadFilesModal
        open={open}
        onClose={() => setOpen(false)}
        referenceId={projectId}
        type="document"
        title="Documentos del Proyecto"
      />
    </>
  );
}
