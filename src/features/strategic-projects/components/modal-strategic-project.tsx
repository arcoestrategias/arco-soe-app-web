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
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/shared/components/single-date-picker";
import { TextareaWithCounter } from "@/shared/components/textarea-with-counter";
import ObjectiveSelect from "@/shared/components/objective-select";
import { UploadFilesModal } from "@/shared/components/upload-files-modal";
import * as FiltersStorage from "@/shared/filters/storage";
import { toast } from "sonner";

// -------------------- Tipos --------------------
export type ModalMode = "crear" | "editar" | "ver";

export type StrategicProjectFormValues = {
  name: string;
  description?: string | null;
  objectiveId?: string | null;
  fromAt?: string; // YYYY-MM-DD
  untilAt?: string; // YYYY-MM-DD
  budget?: number | null;
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
        d.getDate()
      ).padStart(2, "0")}`
    : undefined;

const fmtShort = new Intl.DateTimeFormat("es-EC"); // local

function formatCurrencyDisplay(n?: number | null) {
  if (n === null || n === undefined || Number.isNaN(n)) return "";
  try {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return `$ ${Number(n).toFixed(2)}`;
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
    },
  });

  // Estado visual del picker (no persiste al form hasta "Aplicar")
  const [range, setRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [isDateOpen, setIsDateOpen] = useState(false);

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
    };

    reset(defaults, { keepDirty: false });

    setRange({
      from: parseYmdOrIso(defaults.fromAt),
      to: parseYmdOrIso(defaults.untilAt),
    });
  }, [isOpen, initial, reset]);

  // Budget con máscara
  const [budgetDisplay, setBudgetDisplay] = useState<string>(
    formatCurrencyDisplay(initial?.budget ?? null)
  );
  useEffect(() => {
    setBudgetDisplay(formatCurrencyDisplay(initial?.budget ?? null));
  }, [isOpen, initial]);

  const onBudgetChange = (txt: string) => {
    setBudgetDisplay(txt);
    const n = parseCurrencyInput(txt);
    setValue("budget", n, { shouldDirty: true });
  };
  const onBudgetBlur = () => {
    const n = parseCurrencyInput(budgetDisplay);
    setBudgetDisplay(formatCurrencyDisplay(n));
    setValue("budget", n, { shouldDirty: true, shouldTouch: true });
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
    };

    if (modo === "crear") {
      onSave({ mode: "crear", payload });
    } else {
      onSave({ mode: "editar", id: projectId ?? undefined, payload });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="sm:max-w-2xl">
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
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Nombre */}
          <div className="space-y-2 md:col-span-1">
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
                  // disabled={readOnly}
                />
              )}
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Propósito */}
          <div className="space-y-2 md:col-span-1">
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
          <div className="space-y-2 md:col-span-1">
            <Label>Meta Estratégica</Label>
            <Controller
              name="objectiveId"
              control={control}
              render={({ field }) => (
                <ObjectiveSelect
                  planId={resolvedPlanId ?? undefined}
                  positionId={resolvedPositionId ?? undefined}
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
          <div className="space-y-2 md:col-span-1">
            <Label>Presupuesto Total</Label>
            <Input
              inputMode="decimal"
              placeholder="$ 0,00"
              value={budgetDisplay}
              onChange={(e) => onBudgetChange(e.target.value)}
              onBlur={onBudgetBlur}
              disabled={readOnly}
            />
            <p className="text-[11px] text-muted-foreground">
              Monto en USD. Se formátea automáticamente.
            </p>
          </div>

          {/* Fechas (sin límites) */}
          <div className="space-y-2 md:col-span-2">
            <Label>Fechas</Label>
            <div className="flex items-center gap-2">
              <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                <PopoverTrigger asChild>
                  <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] px-3 py-1 cursor-pointer">
                    {dFrom && dTo
                      ? `${fmtShort.format(dFrom)} - ${fmtShort.format(dTo)}`
                      : "Seleccionar fechas"}
                  </Badge>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <DateRangePicker
                    date={range}
                    onChange={(r) => r && setRange(r)} // solo UI
                    // 👇 sin minDate ni maxDate = sin límites
                    onClose={() => setIsDateOpen(false)}
                    onApply={(r) => {
                      if (!r?.from || !r?.to) return;
                      setRange({ from: r.from, to: r.to });
                      setValue("fromAt", toYmd(r.from)!, { shouldDirty: true });
                      setValue("untilAt", toYmd(r.to)!, { shouldDirty: true });
                    }}
                  />
                </PopoverContent>
              </Popover>

              <Input
                className="max-w-[180px]"
                value={dFrom ? fmtShort.format(dFrom) : ""}
                readOnly
                placeholder="Inicio"
              />
              <span className="text-muted-foreground text-xs">→</span>
              <Input
                className="max-w-[180px]"
                value={dTo ? fmtShort.format(dTo) : ""}
                readOnly
                placeholder="Fin"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Puedes elegir cualquier rango de fechas.
            </p>
          </div>

          <DialogFooter className="md:col-span-2 mt-4">
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
