"use client";

import * as React from "react";
import { useMemo, useState, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { InputWithCounter } from "@/shared/components/input-with-counter";
import ObjectiveStrategicSelect from "@/shared/components/objective-strategic-select";
import { ConfirmModal } from "@/shared/components/confirm-modal";

import { getHumanErrorMessage } from "@/shared/api/response";
import { QKEY } from "@/shared/api/query-keys";
import { configureObjective } from "@/features/strategic-plans/services/objectivesService";
import {
  ConfigureObjectiveDto,
  ConfigureObjectiveMonths,
} from "@/features/strategic-plans/types/objectives";
import { ChevronDown } from "lucide-react";

import { useStrategicPlan } from "@/features/strategic-plans/hooks/use-strategic-plans";
import { pickPlanDates } from "@/shared/utils/pick-plan-dates";
import {
  deriveMonthsForPayload,
  enumerateMonths,
  monthLabel,
  ymToStr,
  toMonthStart,
  enumerateEndMonthsByFrequency,
} from "@/shared/utils/month-helpers";

// ===== Tipos mínimos =====
type ObjectiveSeed = {
  id: string;
  name?: string | null;
  description?: string | null;
  perspective?: "FIN" | "CLI" | "PRO" | "PER" | null;
  level?: "EST" | "OPE" | null;
  valueOrientation?: "CRE" | "REN" | null;
  objectiveParentId?: string | null;
  positionId?: string | null;
  strategicPlanId?: string | null;
  goalValue?: number | null;
  baseValue?: number | null;
  status?: string | null;
};

type IndicatorSeed = {
  id?: string | null;
  name?: string | null;
  description?: string | null;
  formula?: string | null;
  origin?: "MAN" | "AUT" | null;
  tendence?: "POS" | "NEG" | "MAN" | "HIT" | null;
  frequency?: "TRI" | "QTR" | "MES" | "STR" | "ANU" | "PER" | null;
  measurement?: "POR" | "RAT" | "UNI" | "MON" | "UNC" | null;
  type?: "RES" | "GES" | null;
  reference?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  weeklyConfigEnabled?: boolean | null;
  periodicity?: "WEEKLY" | "CUSTOM" | null;
  measurementCount?: number | null;
  calculationMethod?: "ACCUMULATIVE" | "AVERAGE" | "LAST_VALUE" | null;
};

export type ObjectiveConfigureData = {
  objective: ObjectiveSeed;
  indicator: IndicatorSeed | null;
  months?: ConfigureObjectiveMonths[];
  rangeExceptional?: number | null;
  rangeInacceptable?: number | null;
  isNew?: boolean;
  monthsWithPersonalizedCount?: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  data: ObjectiveConfigureData;
  strategicPlanId: string;
  positionId: string;
  year?: number;
};

// ---- Util local
function diff<T extends object>(initial: T, current: T): Partial<T> {
  const changed: any = {};
  Object.keys(current || {}).forEach((k) => {
    const a: any = (initial as any)?.[k];
    const b: any = (current as any)?.[k];
    if (JSON.stringify(a) !== JSON.stringify(b)) changed[k] = b;
  });
  return changed;
}

type MonthItem = { month: number; year: number };

const monthKey = (m: MonthItem) => `${m.year}-${m.month}`;

const sanitizeMonths = (arr: any): MonthItem[] =>
  (Array.isArray(arr) ? arr : [])
    .filter(Boolean)
    .map((m) => ({
      month: Number(m?.month),
      year: Number(m?.year),
    }))
    .filter(
      (m) =>
        Number.isInteger(m.month) &&
        m.month >= 1 &&
        m.month <= 12 &&
        Number.isInteger(m.year),
    );

// agrega / quita un mes, evitando duplicados
const toggleMonthIn = (prev: MonthItem[], m: MonthItem) => {
  const key = monthKey(m);
  const set = new Set(prev.map(monthKey));
  if (set.has(key)) {
    return prev.filter((x) => monthKey(x) !== key);
  }
  return [...prev, m];
};

// Multiplicador por frecuencia para "Meta Frecuencia"
const freqMultiplier = (f?: IndicatorSeed["frequency"]): number =>
  f === "TRI" ? 3 : f === "QTR" ? 4 : f === "STR" ? 6 : 1;

export default function ObjectiveConfigureModal({
  open,
  onClose,
  data,
  strategicPlanId,
  positionId,
  year,
}: Props) {
  const qc = useQueryClient();

  // ------- Estado base
  const [objective, setObjective] = useState<ObjectiveSeed>(() => ({
    ...data.objective,
  }));

  const [indicator, setIndicator] = useState<IndicatorSeed>(
    () => ({ ...data.indicator }) as IndicatorSeed,
  );

  // Normaliza a inicio de mes sólo una vez (si vienen con día 12 p.ej.)
  useEffect(() => {
    setIndicator((s) => {
      if (!s) return s;
      const ps = toMonthStart(s.periodStart) ?? s.periodStart;
      const pe = toMonthStart(s.periodEnd) ?? s.periodEnd;
      if (ps === s.periodStart && pe === s.periodEnd) return s;
      return { ...s, periodStart: ps, periodEnd: pe };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [monthsSelected, setMonthsSelected] = useState<
    ConfigureObjectiveMonths[]
  >(() => sanitizeMonths(data.months));

  const [rangeExceptional, setRangeExceptional] = useState<number | undefined>(
    data.rangeExceptional ?? undefined,
  );
  const [rangeInacceptable, setRangeInacceptable] = useState<
    number | undefined
  >(data.rangeInacceptable ?? undefined);

  const [showMapFields, setShowMapFields] = useState(false);

  // ------- Confirmación por cambios críticos
  const [confirm, setConfirm] = useState<
    { open: false } | { open: true; message: string }
  >({ open: false });
  const [personalizedConfirm, setPersonalizedConfirm] = useState<{
    open: boolean; applyToAll: boolean;
  }>({ open: false, applyToAll: false });
  const [applyForceAll, setApplyForceAll] = useState(false);
  const personalizedCount = data.monthsWithPersonalizedCount ?? 0;

  const isDiffVal = (a: any, b: any) =>
    JSON.stringify(a ?? null) !== JSON.stringify(b ?? null);

  const getCriticalChanges = () => {
    const changed: string[] = [];
    if (isDiffVal(data.objective?.goalValue, objective?.goalValue))
      changed.push("meta (goalValue)");
    if (isDiffVal(data.objective?.baseValue, objective?.baseValue))
      changed.push("línea base (baseValue)");
    if (isDiffVal(data.indicator?.tendence, indicator?.tendence))
      changed.push("tendencia");
    if (isDiffVal(data.indicator?.measurement, indicator?.measurement))
      changed.push("medida");
    if (
      isDiffVal(data.indicator?.calculationMethod, indicator?.calculationMethod)
    )
      changed.push("método de cálculo");
    if (isDiffVal(data.indicator?.periodicity, indicator?.periodicity))
      changed.push("periodicidad de medición");
    if (
      isDiffVal(data.indicator?.measurementCount, indicator?.measurementCount)
    )
      changed.push("cantidad de mediciones");
    // const dPS = (data.indicator?.periodStart ?? "").slice(0, 10);
    // const iPS = (indicator?.periodStart ?? "").slice(0, 10);
    // const dPE = (data.indicator?.periodEnd ?? "").slice(0, 10);
    // const iPE = (indicator?.periodEnd ?? "").slice(0, 10);
    // if (isDiffVal(dPS, iPS)) changed.push("fecha de inicio");
    // if (isDiffVal(dPE, iPE)) changed.push("fecha de fin");
    return changed;
  };

  // ------- Plan → límites selects
  const planQ = useStrategicPlan(strategicPlanId);
  const { startISO: planStartISO, endISO: planEndISO } = pickPlanDates(
    planQ.data,
  );

  // Inicio: todos los meses del plan
  const startOptions = useMemo(
    () => enumerateMonths(planStartISO, planEndISO),
    [planStartISO, planEndISO],
  );

  // Fin: desde periodStart (si hay) hasta fin del plan
  const endOptions = useMemo(
    () =>
      enumerateEndMonthsByFrequency(
        indicator?.periodStart ?? undefined,
        planEndISO,
        indicator?.frequency ?? undefined,
      ),
    [indicator?.periodStart, indicator?.frequency, planEndISO],
  );

  // Autoderivar months para frecuencias ≠ PER
  useEffect(() => {
    if (!indicator?.periodStart || !indicator?.periodEnd) return;
    if (indicator?.frequency === "PER") return;
    const derived = deriveMonthsForPayload(
      indicator.periodStart,
      indicator.periodEnd,
      indicator.frequency ?? undefined,
    );
    setMonthsSelected(sanitizeMonths(derived));
  }, [indicator?.periodStart, indicator?.periodEnd, indicator?.frequency]);

  // Autocalcular fechas inicio/fin si es PER (basado en meses seleccionados)
  useEffect(() => {
    if (indicator?.frequency !== "PER") return;

    const selected = Array.isArray(monthsSelected) ? monthsSelected : [];
    if (selected.length === 0) return;

    const sorted = [...selected].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const newStart = ymToStr(first.year, first.month);
    const newEnd = ymToStr(last.year, last.month);

    setIndicator((prev) => {
      if (prev.periodStart === newStart && prev.periodEnd === newEnd)
        return prev;
      return { ...prev, periodStart: newStart, periodEnd: newEnd };
    });
  }, [monthsSelected, indicator?.frequency]);

  const toggleMonth = useCallback((m: ConfigureObjectiveMonths) => {
    setMonthsSelected((prev) => toggleMonthIn(sanitizeMonths(prev), m));
  }, []);

  // ------- Mutation
  const { mutate: doConfigure, isPending } = useMutation({
    mutationFn: async () => {
      const payload: Omit<ConfigureObjectiveDto, "objectiveId"> = {};

      const objectiveDiff = diff(data.objective || {}, objective || {});

      // Si es configuración nueva, forzamos el envío de Meta y Línea Base para asegurar que se guarden
      if (data.isNew) {
        if (objective.goalValue !== null && objective.goalValue !== undefined) {
          (objectiveDiff as any).goalValue = objective.goalValue;
        }
        if (objective.baseValue !== null && objective.baseValue !== undefined) {
          (objectiveDiff as any).baseValue = objective.baseValue;
        }
      }

      if (Object.keys(objectiveDiff).length > 0)
        payload.objective = objectiveDiff as any;

      const indicatorDiff = diff(data.indicator || {}, indicator || {});
      if (Object.keys(indicatorDiff).length > 0)
        payload.indicator = indicatorDiff as any;

      if (typeof rangeExceptional === "number")
        payload.rangeExceptional = rangeExceptional;
      if (typeof rangeInacceptable === "number")
        payload.rangeInacceptable = rangeInacceptable;

      const isPer = indicator?.frequency === "PER";

      if (isPer) {
        payload.months = sanitizeMonths(monthsSelected)
          .slice()
          .sort((a, b) => a.year - b.year || a.month - b.month);
      } else if (indicator?.periodStart && indicator?.periodEnd) {
        payload.months = deriveMonthsForPayload(
          indicator.periodStart,
          indicator.periodEnd,
          indicator.frequency ?? undefined,
        );
      }

      if (applyForceAll) (payload as any).forceAll = true;
      return configureObjective(objective.id, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QKEY.objectivesUnconfigured(strategicPlanId, positionId),
      });
      qc.resetQueries({ queryKey: ["objectives", "ico-board"] });
      toast.success("Objetivo configurado correctamente");
      onClose();
    },
    onError: (err) => {
      toast.error(getHumanErrorMessage(err));
    },
  });

  const isNew = !!data?.isNew;

  function requiredErrorsForNew(): string[] {
    if (!isNew) return [];
    const errs: string[] = [];

    // Fecha inicio
    if (!indicator?.periodStart) errs.push("Fecha inicio");

    // Fecha fin
    if (!indicator?.periodEnd) {
      errs.push("Fecha fin");
    } else if (
      indicator?.periodStart &&
      indicator.periodEnd < indicator.periodStart
    ) {
      errs.push("Fecha fin (debe ser ≥ inicio)");
    }

    // Meta
    if (
      objective?.goalValue === null ||
      objective?.goalValue === undefined ||
      Number.isNaN(Number(objective?.goalValue))
    ) {
      errs.push("Meta");
    }

    // Rangos
    if (typeof rangeInacceptable !== "number") errs.push("Rango inaceptable");
    if (typeof rangeExceptional !== "number") errs.push("Rango excepcional");

    // Si es personalizado, debe seleccionar al menos un mes
    if (
      indicator?.frequency === "PER" &&
      (!monthsSelected || monthsSelected.length === 0)
    ) {
      errs.push("Meses a medir (para personalizado)");
    }

    return errs;
  }

  const handleApply = () => {
    const isPer = indicator?.frequency === "PER";
    const isNew = !!data?.isNew;

    // 1) Siempre: PER requiere al menos un mes seleccionado
    if (isPer && (!monthsSelected || monthsSelected.length === 0)) {
      toast.error(
        "Selecciona al menos un mes para la frecuencia personalizada.",
      );
      return;
    }

    // 2) Objetivo 'no configurado': valida obligatorios y aplica directo
    if (isNew) {
      const missing = requiredErrorsForNew(); // ya incluye check de meses PER
      if (missing.length > 0) {
        toast.error(`Completa los campos obligatorios: ${missing.join(", ")}`);
        return;
      }
      doConfigure();
      return;
    }

    // VALIDACIÓN LÍNEA BASE vs META (según tendencia)
    const tendence = indicator?.tendence;
    const goal = objective.goalValue;
    const base = objective.baseValue;

    if (tendence && typeof goal === "number" && typeof base === "number") {
      if (tendence === "POS" && base >= goal) {
        toast.error(
          `En tendencia CRECIENTE, la Meta (${goal}) debe ser mayor que la Línea Base (${base}).`,
        );
        return;
      }
      if (tendence === "NEG" && base < goal) {
        toast.error(
          `En tendencia DECRECIENTE, la Meta (${goal}) debe ser menor o igual que la Línea Base (${base}).`,
        );
        return;
      }
    }

    // 2.5) Verificar meses con cantidad personalizada
    if (personalizedCount > 0) {
      setPersonalizedConfirm({ open: true, applyToAll: false });
      return;
    }

    // 3) Objetivo ya configurado: sólo confirmación si hay cambios críticos
    const changed = getCriticalChanges();
    if (changed.length > 0) {
      const isMeasChange =
        changed.includes("cantidad de mediciones") ||
        changed.includes("periodicidad de medición");
      const isCalcChange = changed.includes("método de cálculo");
      const onlyMeasChange =
        isMeasChange && !isCalcChange && changed.length === 1;
      const onlyCalcChange =
        isCalcChange && !isMeasChange && changed.length === 1;
      const list =
        changed.length === 1
          ? `la ${changed[0]}`
          : `los campos críticos (${changed.join(", ")})`;

      const oldCount = data.indicator?.measurementCount;
      const newCount = indicator?.measurementCount;
      const countDiff =
        oldCount != null && newCount != null ? newCount - oldCount : 0;
      const countReduced = countDiff < 0;
      const countIncreased = countDiff > 0;

      const methodLabels: Record<string, string> = {
        ACCUMULATIVE: "Acumulativo",
        AVERAGE: "Promedio",
        LAST_VALUE: "Último valor",
      };
      const oldMethodLabel = data.indicator?.calculationMethod
        ? (methodLabels[data.indicator.calculationMethod] ??
          data.indicator.calculationMethod)
        : null;
      const newMethodLabel = indicator?.calculationMethod
        ? (methodLabels[indicator.calculationMethod] ??
          indicator.calculationMethod)
        : null;

      let message = "";
      if (onlyMeasChange && countReduced) {
        message = `Al reducir la cantidad de mediciones, se conservarán las últimas mediciones registradas y se eliminarán las sobrantes, y se recalculará nuevamente los meses con medición. ¿Desea continuar?`;
      } else if (onlyMeasChange && countIncreased) {
        message = `La cantidad de mediciones aumentará. Aparecerán nuevas filas vacías para completar, y se recalculará nuevamente los meses con medición. ¿Desea continuar?`;
      } else if (onlyMeasChange && !countReduced && !countIncreased) {
        message = `Se recalcularán los meses con mediciones con la nueva configuración. ¿Desea continuar?`;
      } else if (onlyCalcChange && oldMethodLabel && newMethodLabel) {
        message = `Se cambiará el método de cálculo de '${oldMethodLabel}' a '${newMethodLabel}'. Se recalcularán los meses con mediciones. ¿Desea continuar?`;
      } else if (onlyCalcChange) {
        message = `Se recalcularán los meses con mediciones con el nuevo método. ¿Desea continuar?`;
      } else if (isMeasChange || isCalcChange) {
        const parts: string[] = [];
        if (countReduced)
          parts.push(
            `Al reducir la cantidad de mediciones, se conservarán las últimas registradas`,
          );
        else if (countIncreased)
          parts.push(`La cantidad de mediciones aumentará`);
        if (
          oldMethodLabel &&
          newMethodLabel &&
          oldMethodLabel !== newMethodLabel
        )
          parts.push(
            `se cambiará el método de cálculo de '${oldMethodLabel}' a '${newMethodLabel}'`,
          );
        message =
          parts.length > 0
            ? parts.join(", ") +
              ", y se recalculará nuevamente los meses con medición. ¿Desea continuar?"
            : `Se recalcularán los meses con mediciones. ¿Desea continuar?`;
      } else {
        message =
          `Está intentando actualizar ${list}. Al modificar estos campos, ` +
          `se está alterando la naturaleza del objetivo, por lo que se perderán los cumplimientos asociados.`;
      }

      setConfirm({ open: true, message });
      return;
    }

    // 4) Sin cambios críticos → aplica
    doConfigure();
  };

  // Meta Frecuencia (solo UI): se recalcula con frecuencia o meta
  const metaFrecuencia = React.useMemo(() => {
    const goal = objective?.goalValue;
    // si no hay meta numérica, no mostramos nada
    if (goal === null || goal === undefined || Number.isNaN(Number(goal))) {
      return undefined;
    }
    return Number(goal) * freqMultiplier(indicator?.frequency);
  }, [objective?.goalValue, indicator?.frequency]);

  // ------- Render
  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="w-[95vw] sm:max-w-[800px] md:max-w-[900px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Objetivo</DialogTitle>
          <DialogDescription>
            Ajusta los datos del objetivo y su indicador.
          </DialogDescription>
        </DialogHeader>

        {/* === Objetivo === */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Objetivo</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => setShowMapFields((s) => !s)}
              aria-expanded={showMapFields}
            >
              <ChevronDown
                className={`mr-1 h-4 w-4 transition-transform ${
                  showMapFields ? "rotate-180" : ""
                }`}
              />
              {showMapFields ? "Ocultar campos de mapa" : "Ver campos de mapa"}
            </Button>
          </div>

          {/* Nombre del objetivo (siempre visible) */}
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium text-foreground">
              Nombre
            </label>
            <InputWithCounter
              className="w-full"
              value={objective.name ?? ""}
              onChange={(val) => setObjective((s) => ({ ...s, name: val }))}
              maxLength={500}
              placeholder="Nombre del objetivo"
            />
          </div>

          {/* Campos de mapa (opcionales) */}
          {showMapFields && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-4">
              <div className="md:col-span-6 min-w-0">
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Nivel
                </label>
                <Select
                  value={objective.level ?? undefined}
                  onValueChange={(v) =>
                    setObjective((s) => ({ ...s, level: v as any }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EST">Estratégico</SelectItem>
                    <SelectItem value="OPE">Operativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-6 min-w-0">
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Orientación
                </label>
                <Select
                  value={objective.valueOrientation ?? undefined}
                  onValueChange={(v) =>
                    setObjective((s) => ({
                      ...s,
                      valueOrientation: v as any,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRE">Crecimiento</SelectItem>
                    <SelectItem value="REN">Rentabilidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-6 min-w-0">
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Perspectiva
                </label>
                <Select
                  value={objective.perspective ?? undefined}
                  onValueChange={(v) =>
                    setObjective((s) => ({ ...s, perspective: v as any }))
                  }
                  disabled={objective.level === "OPE"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIN">Financiera</SelectItem>
                    <SelectItem value="CLI">Clientes</SelectItem>
                    <SelectItem value="PRO">Procesos</SelectItem>
                    <SelectItem value="PER">Personas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-6 min-w-0">
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Objetivo al que impacta
                </label>
                <ObjectiveStrategicSelect
                  planId={strategicPlanId}
                  value={objective.objectiveParentId ?? undefined}
                  onChange={(val) =>
                    setObjective((s) => ({
                      ...s,
                      objectiveParentId: val ?? null,
                    }))
                  }
                  currentObjectiveId={objective.id}
                  disabled={objective.level === "OPE"}
                />
              </div>
            </div>
          )}
        </section>

        <hr className="my-4" />

        {/* === Indicador === */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold">Indicador</h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Nombre */}
            <div className="md:col-span-12 min-w-0">
              <label className="mb-1 block text-xs font-medium text-foreground">
                Nombre
              </label>
              <InputWithCounter
                className="w-full"
                value={indicator?.name ?? ""}
                onChange={(val) => setIndicator((s) => ({ ...s, name: val }))}
                maxLength={500}
                placeholder="Nombre del indicador"
              />
            </div>

            <div className="md:col-span-4 min-w-0">
              <label className="mb-1 block text-xs font-medium text-foreground">
                Tendencia
              </label>
              <Select
                value={indicator?.tendence ?? undefined}
                onValueChange={(v) =>
                  setIndicator((s) => ({ ...s, tendence: v as any }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POS">Creciente</SelectItem>
                  <SelectItem value="NEG">Decreciente</SelectItem>
                  <SelectItem value="MAN">Mantenimiento</SelectItem>
                  <SelectItem value="HIT">Hito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-4 min-w-0">
              <label className="mb-1 block text-xs font-medium text-foreground">
                Medida
              </label>
              <Select
                value={indicator?.measurement ?? undefined}
                onValueChange={(v) =>
                  setIndicator((s) => ({ ...s, measurement: v as any }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POR">Porcentaje</SelectItem>
                  <SelectItem value="RAT">Ratio</SelectItem>
                  <SelectItem value="UNI">Unidad</SelectItem>
                  <SelectItem value="MON">Moneda</SelectItem>
                  <SelectItem value="UNC">Único</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-4 min-w-0">
              <label className="mb-1 block text-xs font-medium text-foreground">
                Tipo
              </label>
              <Select
                value={indicator?.type ?? undefined}
                onValueChange={(v) =>
                  setIndicator((s) => ({ ...s, type: v as any }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RES">Resultado</SelectItem>
                  <SelectItem value="GES">Gestión</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Frecuencia */}
            <div className="md:col-span-4 min-w-0">
              <label className="mb-1 block text-xs font-medium text-foreground">
                Frecuencia
              </label>
              <Select
                value={indicator?.frequency ?? undefined}
                onValueChange={(v) => {
                  const freq = v as IndicatorSeed["frequency"];

                  // 1) Cambiar frecuencia y SIEMPRE limpiar Fecha fin (requisito)
                  setIndicator((s) => ({
                    ...s,
                    frequency: freq,
                    periodEnd: undefined,
                  }));

                  // 2) Ajustar 'monthsSelected' según la nueva frecuencia
                  setMonthsSelected((prev) => {
                    const prevClean = sanitizeMonths(prev);

                    if (freq === "PER") {
                      // Mantener la selección previa, pero SOLO los que estén dentro del plan
                      const universe = enumerateMonths(
                        planStartISO,
                        planEndISO,
                      );
                      const allowed = new Set(
                        universe.map((m) => `${m.year}-${m.month}`),
                      );
                      return prevClean.filter((m) =>
                        allowed.has(`${m.year}-${m.month}`),
                      );
                    }

                    // Para cualquier otra frecuencia:
                    // - Como acabamos de limpiar Fecha fin, no hay rango completo -> vaciar
                    // - Se recalculará cuando el usuario vuelva a escoger Fecha fin
                    return [];
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MES">Mensual</SelectItem>
                  <SelectItem value="TRI">Trimestral</SelectItem>
                  <SelectItem value="QTR">Cuatrimestral</SelectItem>
                  <SelectItem value="STR">Semestral</SelectItem>
                  <SelectItem value="ANU">Anual</SelectItem>
                  <SelectItem value="PER">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fecha inicio */}
            <div className="md:col-span-4 min-w-0">
              <label className="mb-1 block text-xs font-medium text-foreground">
                Fecha inicio
              </label>
              <Select
                value={(indicator?.periodStart ?? "").slice(0, 10) || undefined}
                onValueChange={(v) => {
                  const [y, m] = [Number(v.slice(0, 4)), Number(v.slice(5, 7))];
                  const newStart = ymToStr(y, m);
                  setIndicator((s) => {
                    const endOk =
                      s?.periodEnd && s.periodEnd >= newStart
                        ? s.periodEnd
                        : undefined;
                    return { ...s, periodStart: newStart, periodEnd: endOk };
                  });

                  // Si no es PER y hay fin válido + frecuencia, re-derivar monthsSelected
                  if (indicator?.frequency && indicator.frequency !== "PER") {
                    if (
                      indicator?.periodEnd &&
                      indicator.periodEnd >= newStart
                    ) {
                      setMonthsSelected(
                        deriveMonthsForPayload(
                          newStart,
                          indicator.periodEnd,
                          indicator.frequency,
                        ),
                      );
                    } else {
                      setMonthsSelected([]);
                    }
                  }
                }}
                disabled={
                  !planStartISO || !planEndISO || indicator?.frequency === "PER"
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !planStartISO || !planEndISO
                        ? "Sin período de plan"
                        : "Selecciona"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {startOptions.map((m) => {
                    const value = ymToStr(m.year, m.month);
                    return (
                      <SelectItem key={value} value={value}>
                        {monthLabel(m.month, m.year)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha fin */}
            <div className="md:col-span-4 min-w-0">
              <label className="mb-1 block text-xs font-medium text-foreground">
                Fecha fin
              </label>
              <Select
                value={(indicator?.periodEnd ?? "").slice(0, 10) || undefined}
                onValueChange={(v) => {
                  const [y, m] = [Number(v.slice(0, 4)), Number(v.slice(5, 7))];
                  const newEnd = ymToStr(y, m);
                  setIndicator((s) => ({ ...s, periodEnd: newEnd }));

                  if (
                    indicator?.frequency &&
                    indicator.frequency !== "PER" &&
                    indicator?.periodStart
                  ) {
                    setMonthsSelected(
                      deriveMonthsForPayload(
                        indicator.periodStart,
                        newEnd,
                        indicator.frequency,
                      ),
                    );
                  }
                }}
                disabled={
                  !indicator?.periodStart ||
                  !planEndISO ||
                  indicator?.frequency === "PER"
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      indicator?.periodStart
                        ? "Selecciona"
                        : "Primero el inicio"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {endOptions.map((m) => {
                    const value = ymToStr(m.year, m.month);
                    return (
                      <SelectItem key={value} value={value}>
                        {monthLabel(m.month, m.year)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Meta (goalValue) */}
            <div className="md:col-span-4 min-w-0">
              <label className="mb-1 block text-xs font-medium text-foreground">
                Meta
              </label>
              <Input
                className="w-full"
                type="number"
                value={objective.goalValue ?? ""}
                onChange={(e) =>
                  setObjective((s) => ({
                    ...s,
                    goalValue:
                      e.target.value === ""
                        ? (null as any)
                        : Number(e.target.value),
                  }))
                }
                placeholder="Ej.: 7"
              />
            </div>

            {/* Línea Base (baseValue) */}
            <div className="md:col-span-4 min-w-0">
              <label className="mb-1 block text-xs font-medium text-foreground">
                Línea Base (Tolerancia)
              </label>
              <Input
                className="w-full"
                type="number"
                value={objective.baseValue ?? ""}
                onChange={(e) =>
                  setObjective((s) => ({
                    ...s,
                    baseValue:
                      e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                placeholder="Ej.: 5"
              />
            </div>

            <div className="md:col-span-4 min-w-0">
              <label className="mb-1 block text-xs font-medium text-foreground">
                Meta Frecuencia
              </label>
              <Input
                className="w-full"
                type="number"
                value={metaFrecuencia ?? ""}
                readOnly
                disabled
              />
            </div>

            {/* Fuente */}
            <div className="md:col-span-4 min-w-0">
              <label className="mb-1 block text-xs font-medium text-foreground">
                Fuente
              </label>
              <Select
                value={indicator?.origin ?? undefined}
                onValueChange={(v) =>
                  setIndicator((s) => ({ ...s, origin: v as any }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAN">Manual</SelectItem>
                  <SelectItem value="AUT">Automático</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Detalle fuente */}
            <div className="md:col-span-6 min-w-0">
              <label className="mb-1 block text-xs font-medium text-foreground">
                Detalle de la fuente
              </label>
              <InputWithCounter
                className="w-full"
                value={indicator?.reference ?? ""}
                onChange={(val) =>
                  setIndicator((s) => ({ ...s, reference: val }))
                }
                maxLength={1000}
                placeholder="Detalle el nombre del reporte o sistema"
              />
            </div>

            {/* Fórmula */}
            <div className="md:col-span-6 min-w-0">
              <label className="mb-1 block text-xs font-medium text-foreground">
                Fórmula
              </label>
              <InputWithCounter
                className="w-full"
                value={indicator?.formula ?? ""}
                onChange={(val) =>
                  setIndicator((s) => ({ ...s, formula: val }))
                }
                maxLength={1000}
                placeholder="Detalle de la fórmula"
              />
            </div>
          </div>
        </section>

        {/* Configuración de Medición Mensual (solo para MES) */}
        {indicator?.frequency === "MES" && (
          <section className="space-y-3 mt-4">
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="weeklyConfigEnabled"
                  checked={indicator?.weeklyConfigEnabled ?? false}
                  onCheckedChange={(c) =>
                    setIndicator((s) => ({
                      ...s,
                      weeklyConfigEnabled: !!c,
                      ...(c
                        ? {}
                        : {
                            periodicity: undefined,
                            measurementCount: undefined,
                            calculationMethod: undefined,
                          }),
                    }))
                  }
                />
                <Label
                  htmlFor="weeklyConfigEnabled"
                  className="cursor-pointer text-sm font-semibold"
                >
                  Configuración de Medición Mensual
                </Label>
              </div>

              {indicator?.weeklyConfigEnabled && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="mb-1 block text-xs font-medium text-foreground">
                      Periodicidad de medición
                    </Label>
                    <Select
                      value={indicator?.periodicity ?? undefined}
                      onValueChange={(v) =>
                        setIndicator((s) => ({
                          ...s,
                          periodicity: v as "WEEKLY" | "CUSTOM",
                          measurementCount:
                            v === "WEEKLY" ? 4 : (s.measurementCount ?? 2),
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WEEKLY">Semanal</SelectItem>
                        <SelectItem value="CUSTOM">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-1 block text-xs font-medium text-foreground">
                      Cantidad de Mediciones
                    </Label>
                    <Input
                      type="number"
                      min={2}
                      max={50}
                      value={indicator?.measurementCount ?? ""}
                      disabled={indicator?.periodicity === "WEEKLY"}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        if (isNaN(v)) return;
                        setIndicator((s) => ({
                          ...s,
                          measurementCount: Math.min(50, Math.max(2, v)),
                        }));
                      }}
                      className="h-10"
                    />
                  </div>

                  <div>
                    <Label className="mb-1 block text-xs font-medium text-foreground">
                      Método de Cálculo
                    </Label>
                    <Select
                      value={indicator?.calculationMethod ?? undefined}
                      onValueChange={(v) =>
                        setIndicator((s) => ({
                          ...s,
                          calculationMethod: v as
                            | "ACCUMULATIVE"
                            | "AVERAGE"
                            | "LAST_VALUE",
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACCUMULATIVE">
                          Acumulativo
                        </SelectItem>
                        <SelectItem value="AVERAGE">Promedio</SelectItem>
                        <SelectItem value="LAST_VALUE">Último valor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {indicator?.frequency === "PER" && (
          <section className="space-y-3 mt-4">
            <h3 className="text-sm font-semibold">Meses a medir</h3>

            {(() => {
              const universe = enumerateMonths(planStartISO, planEndISO); // TODOS los meses del plan
              const selected = Array.isArray(monthsSelected)
                ? monthsSelected
                : [];

              if (universe.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground">
                    Sin período de plan para listar los meses.
                  </p>
                );
              }

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {universe.map((m) => {
                    const key = `${m.year}-${m.month}`;
                    const checked = selected.some(
                      (x) => x && `${x.year}-${x.month}` === key,
                    );
                    return (
                      <label key={key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setMonthsSelected((prev) => {
                              const arr = Array.isArray(prev) ? prev : [];
                              const exists = arr.some(
                                (x) => x && `${x.year}-${x.month}` === key,
                              );
                              return exists
                                ? arr.filter(
                                    (x) => x && `${x.year}-${x.month}` !== key,
                                  )
                                : [...arr, { year: m.year, month: m.month }];
                            });
                          }}
                        />
                        <span className="text-sm">
                          {monthLabel(m.month, m.year)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              );
            })()}
          </section>
        )}

        <hr className="my-4" />

        {/* === Rangos === */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-6 min-w-0">
            <label className="mb-1 block text-xs font-medium text-foreground">
              Rango inaceptable (≤%)
            </label>
            <Input
              className="w-full"
              type="number"
              value={
                typeof rangeInacceptable === "number" ? rangeInacceptable : ""
              }
              onChange={(e) =>
                setRangeInacceptable(
                  e.target.value === "" ? undefined : Number(e.target.value),
                )
              }
              placeholder="p.ej. 75"
            />
          </div>
          <div className="md:col-span-6 min-w-0">
            <label className="mb-1 block text-xs font-medium text-foreground">
              Rango excepcional (≥%)
            </label>
            <Input
              className="w-full"
              type="number"
              value={
                typeof rangeExceptional === "number" ? rangeExceptional : ""
              }
              onChange={(e) =>
                setRangeExceptional(
                  e.target.value === "" ? undefined : Number(e.target.value),
                )
              }
              placeholder="p.ej. 99"
            />
          </div>
        </section>

        <DialogFooter className="mt-6 gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleApply} disabled={isPending}>
            {isPending ? "Aplicando..." : "Aplicar"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Confirmación cambio crítico */}
      <ConfirmModal
        open={confirm.open}
        title={confirm.open ? "Confirmar cambio crítico" : ""}
        message={confirm.open ? confirm.message : ""}
        confirmText="Entiendo, continuar"
        onConfirm={() => {
          setConfirm({ open: false });
          doConfigure();
        }}
        onCancel={() => setConfirm({ open: false })}
      />
      <ConfirmModal
        open={personalizedConfirm.open}
        title="Meses con cantidad personalizada"
        message={`${personalizedCount} mes(es) tienen una cantidad de mediciones personalizada. ¿Desea aplicar el nuevo valor a todos los meses o mantener los valores personalizados?`}
        confirmText="Aplicar a todos"
        cancelText="Mantener personalizados"
        onConfirm={() => {
          setPersonalizedConfirm({ open: false, applyToAll: true });
          setApplyForceAll(true);
          setTimeout(() => {
            const changed = getCriticalChanges();
            if (changed.length > 0) {
              const list = changed.length === 1 ? `la ${changed[0]}` : `los campos críticos (${changed.join(", ")})`;
              setConfirm({
                open: true,
                message: `Está intentando actualizar ${list}. Al modificar estos campos, se está alterando la naturaleza del objetivo, por lo que se perderán los cumplimientos asociados.`,
              });
            } else { doConfigure(); }
          }, 100);
        }}
        onCancel={() => {
          setPersonalizedConfirm({ open: false, applyToAll: false });
          setApplyForceAll(false);
          setTimeout(() => {
            const changed = getCriticalChanges();
            if (changed.length > 0) {
              const isMeasChange = changed.includes("cantidad de mediciones") || changed.includes("periodicidad de medición");
              const isCalcChange = changed.includes("método de cálculo");
              const onlyCalcChange = isCalcChange && !isMeasChange && changed.length === 1;
              const onlyMeasChange = isMeasChange && !isCalcChange && changed.length === 1;
              const oldCount = data.indicator?.measurementCount;
              const newCount = indicator?.measurementCount;
              const countDiff = (oldCount != null && newCount != null) ? newCount - oldCount : 0;
              const countReduced = countDiff < 0;
              const countIncreased = countDiff > 0;
              const methodLabels: Record<string, string> = { ACCUMULATIVE: "Acumulativo", AVERAGE: "Promedio", LAST_VALUE: "Último valor" };
              const oldMethodLabel = data.indicator?.calculationMethod ? (methodLabels[data.indicator.calculationMethod] ?? data.indicator.calculationMethod) : null;
              const newMethodLabel = indicator?.calculationMethod ? (methodLabels[indicator.calculationMethod] ?? indicator.calculationMethod) : null;
              let message = "";
              if (onlyMeasChange && countReduced) message = `Al reducir la cantidad de mediciones, se conservarán las últimas mediciones registradas y se eliminarán las sobrantes, y se recalculará nuevamente los meses con medición. ¿Desea continuar?`;
              else if (onlyMeasChange && countIncreased) message = `La cantidad de mediciones aumentará. Aparecerán nuevas filas vacías para completar, y se recalculará nuevamente los meses con medición. ¿Desea continuar?`;
              else if (onlyCalcChange && oldMethodLabel && newMethodLabel) message = `Se cambiará el método de cálculo de '${oldMethodLabel}' a '${newMethodLabel}'. Se recalcularán los meses con mediciones. ¿Desea continuar?`;
              else {
                const list = changed.length === 1 ? `la ${changed[0]}` : `los campos críticos (${changed.join(", ")})`;
                message = `Está intentando actualizar ${list}. Al modificar estos campos, se está alterando la naturaleza del objetivo, por lo que se perderán los cumplimientos asociados.`;
              }
              setConfirm({ open: true, message });
            } else { doConfigure(); }
          }, 100);
        }}
      />
    </Dialog>
  );
}
