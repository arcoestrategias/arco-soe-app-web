"use client";

import * as React from "react";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import dayjs from "dayjs";
import { useQueryClient } from "@tanstack/react-query";
import { ConfirmModal } from "@/shared/components/confirm-modal";
import type { IcoMonthlyPoint } from "@/features/objectives/types/ico-board";
import { usePermissions } from "@/shared/auth/access-control";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";
import {
  getMeasurements,
  saveMeasurements,
  updateGoalMeasurementCount,
} from "../services/objectiveGoalsService";
import { getHumanErrorMessage } from "@/shared/api/response";

/* -------- mapeos etiqueta (unidad, tendencia, frecuencia) -------- */
const MEASUREMENT_LABEL: Record<string, string> = {
  POR: "Porcentaje",
  RAT: "Ratio",
  UNI: "Unidad",
  MON: "Moneda",
  UNC: "Único",
};
const TENDENCE_LABEL: Record<string, string> = {
  POS: "Creciente",
  NEG: "Decreciente",
  MAN: "Mantenimiento",
  HIT: "Hito",
};
const FREQUENCY_LABEL: Record<string, string> = {
  MES: "Mensual",
  TRI: "Trimestral",
  QTR: "Cuatrimestral",
  STR: "Semestral",
  ANU: "Anual",
  PER: "Personalizado",
};
const PERIODICITY_LABEL: Record<string, string> = {
  WEEKLY: "Semanal",
  CUSTOM: "Personalizado",
};
const CALCULATION_METHOD_LABEL: Record<string, string> = {
  ACCUMULATIVE: "Acumulativo",
  AVERAGE: "Promedio",
  LAST_VALUE: "Último valor",
};

/* -------- nombres de meses -------- */
const MONTH_NAMES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const monthName = (m?: number | null) =>
  typeof m === "number" && m >= 1 && m <= 12 ? MONTH_NAMES_ES[m - 1] : "—";

/* ---------------- props y tipos ---------------- */
export type ObjectiveComplianceChange = {
  id?: string;
  month: number;
  year: number;
  realValue: number | null;
  newGoalValue?: number | null;
  baseValue?: number | null;
  observation?: string | null;
  variationPct?: number | null; // expresado en %
};

type ObjectiveHeader = {
  name?: string | null;
  goalValue?: number | null;
  indicator?: {
    name?: string | null;
    measurement?: string | null;
    tendence?: string | null;
    frequency?: string | null;
    weeklyConfigEnabled?: boolean | null;
    periodicity?: string | null;
    measurementCount?: number | null;
    calculationMethod?: string | null;
  } | null;
};

export function ObjectiveComplianceModal({
  open,
  onOpenChange,
  icoMonthly,
  objective,
  onUpdate,
  title = "Cumplimiento del Objetivo",
  description = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icoMonthly: IcoMonthlyPoint[];
  objective?: ObjectiveHeader | null;
  onUpdate?: (changes: ObjectiveComplianceChange[]) => void;
  title?: string;
  description?: string;
}) {
  const permissions = usePermissions({
    updateCompliance: PERMISSIONS.OBJECTIVE_GOALS.UPDATE_COMPLIANCE,
    updateTargetValue: PERMISSIONS.OBJECTIVE_GOALS.UPDATE_TARGET_VALUE,
    updateBaseValue: PERMISSIONS.OBJECTIVE_GOALS.UPDATE_BASE_VALUE,
  });
  const qc = useQueryClient();

  // Solo meses medidos
  const rows = useMemo(
    () => (icoMonthly ?? []).filter((p) => p.isMeasured),
    [icoMonthly],
  );

  // ===== Estado local
  const [draftReal, setDraftReal] = useState<Record<string, number | null>>({});
  const [draftGoal, setDraftGoal] = useState<Record<string, number | null>>({});
  const [draftBase, setDraftBase] = useState<Record<string, number | null>>({});
  const [draftObs, setDraftObs] = useState<Record<string, string>>({});
  const [measCountModal, setMeasCountModal] = useState<{
    open: boolean; goalId: string; month: number; year: number; currentCount: number;
  }>({ open: false, goalId: "", month: 0, year: 0, currentCount: 4 });
  const [manualMeasCounts, setManualMeasCounts] = useState<Record<string, number>>({});
  const [measurements, setMeasurements] = useState<Record<string, any[]>>({});
  const [measDrafts, setMeasDrafts] = useState<Record<string, any>>({});
  const [loadingMeas, setLoadingMeas] = useState<Record<string, boolean>>({});
  const [measInitialLoaded, setMeasInitialLoaded] = useState(false);

  const weeklyConfig =
    objective?.indicator?.weeklyConfigEnabled &&
    objective?.indicator?.frequency === "MES";
  const measCount = weeklyConfig
    ? (objective?.indicator?.measurementCount ?? 4)
    : 0;
  const calcMethod = weeklyConfig
    ? (objective?.indicator?.calculationMethod ?? "ACCUMULATIVE")
    : null;

  const keyOf = (p: IcoMonthlyPoint) => p.id ?? `${p.year}-${p.month}`;

  const getDraftReal = (p: IcoMonthlyPoint) => draftReal[keyOf(p)];
  const getDraftGoal = (p: IcoMonthlyPoint) => draftGoal[keyOf(p)];
  const getDraftObs = (p: IcoMonthlyPoint) => {
    const k = keyOf(p);
    if (draftObs[k] !== undefined) return draftObs[k];
    return (p as any)?.observation ?? "";
  };

  const handleChangeReal = (p: IcoMonthlyPoint, val: string) => {
    const num = val === "" ? null : Number(val);
    if (val !== "" && Number.isNaN(num)) return;
    setDraftReal((d) => ({ ...d, [keyOf(p)]: num }));
  };

  const handleChangeGoal = (p: IcoMonthlyPoint, val: string) => {
    const num = val === "" ? null : Number(val);
    if (val !== "" && Number.isNaN(num)) return;
    setDraftGoal((d) => ({ ...d, [keyOf(p)]: num }));
  };

  const handleChangeBase = (p: IcoMonthlyPoint, val: string) => {
    const num = val === "" ? null : Number(val);
    if (val !== "" && Number.isNaN(num)) return;
    setDraftBase((d) => ({ ...d, [keyOf(p)]: num }));
  };

  const handleChangeObs = (p: IcoMonthlyPoint, val: string) => {
    setDraftObs((d) => ({ ...d, [keyOf(p)]: val }));
  };

  /** Valor esperado visible (ajustado):
   *  - edición del usuario si existe
   *  - newGoalValue del backend si existe
   *  - si no, goalValue base del punto mensual
   */
  const adjustedGoalOf = (p: IcoMonthlyPoint): number | null => {
    const k = keyOf(p);
    if (Object.prototype.hasOwnProperty.call(draftGoal, k)) {
      return draftGoal[k] ?? null;
    }
    const srv = (p as any)?.newGoalValue;
    if (typeof srv === "number") return srv;
    return typeof p.goalValue === "number" ? p.goalValue : null;
  };

  /** Línea Base visible (ajustada) */
  const adjustedBaseOf = (p: IcoMonthlyPoint): number | null => {
    const k = keyOf(p);
    if (Object.prototype.hasOwnProperty.call(draftBase, k)) {
      return draftBase[k] ?? null;
    }
    // El backend envía baseValue en el punto mensual
    return typeof p.baseValue === "number" ? p.baseValue : null;
  };

  /** ¿la meta mensual cambió respecto a su base (p.goalValue)? */
  const goalChanged = (p: IcoMonthlyPoint) => {
    const base = typeof p.goalValue === "number" ? p.goalValue : null;
    const adj = adjustedGoalOf(p);
    return (adj ?? null) !== (base ?? null);
  };

  /** ¿la línea base mensual cambió? */
  const baseChanged = (p: IcoMonthlyPoint) => {
    const original = typeof p.baseValue === "number" ? p.baseValue : null;
    const current = adjustedBaseOf(p);
    return (current ?? null) !== (original ?? null);
  };

  // Filas que requieren observación (meta cambiada sin texto)
  const rowsMissingObs = rows.filter(
    (p) => goalChanged(p) && !getDraftObs(p).trim(),
  );

  // ¿hay algún cambio en resultado, meta o base?
  const hasAnyRealChange = rows.some((p) =>
    Object.prototype.hasOwnProperty.call(draftReal, keyOf(p)),
  );
  const hasAnyGoalChange = rows.some(goalChanged);
  const hasAnyBaseChange = rows.some(baseChanged);
  const hasMeasChanges =
    weeklyConfig &&
    Object.values(measDrafts).some(
      (drafts: any) =>
        drafts && Object.values(drafts).some((m: any) => m.result != null),
    );
  const hasChanges =
    hasAnyRealChange || hasAnyGoalChange || hasAnyBaseChange || hasMeasChanges;

  // Payload de cambios (incluye variación calculada con objective.goalValue)
  const changes: ObjectiveComplianceChange[] = useMemo(() => {
    const baseObjectiveGoal =
      typeof objective?.goalValue === "number" ? objective.goalValue : null;

    const out: ObjectiveComplianceChange[] = [];
    for (const p of rows) {
      const k = keyOf(p);
      const realTouched = Object.prototype.hasOwnProperty.call(draftReal, k);
      const metaTouched = goalChanged(p);
      const baseTouched = baseChanged(p);
      if (!realTouched && !metaTouched && !baseTouched) continue;

      const finalReal = realTouched
        ? (draftReal[k] ?? null)
        : (p.realValue ?? null);

      const shownGoal = adjustedGoalOf(p);
      const shownBase = adjustedBaseOf(p);

      // Variación % = (Meta del Objetivo - Valor Esperado visible) / Meta del Objetivo * 100
      const varPct =
        baseObjectiveGoal != null &&
        baseObjectiveGoal !== 0 &&
        shownGoal != null
          ? ((baseObjectiveGoal - shownGoal) / baseObjectiveGoal) * 100
          : null;

      out.push({
        id: p.id,
        month: p.month,
        year: p.year,
        realValue: finalReal,
        newGoalValue: metaTouched ? (shownGoal as number | null) : undefined,
        baseValue: baseTouched ? (shownBase as number | null) : undefined,
        observation: metaTouched ? getDraftObs(p) : undefined,
        variationPct: varPct,
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, draftReal, draftGoal, draftBase, draftObs, objective?.goalValue]);

  const handleCancel = () => {
    setDraftReal({});
    setDraftGoal({});
    setDraftObs({});
    setMeasDrafts({});
    onOpenChange(false);
  };

  const [measCountApplyFuture, setMeasCountApplyFuture] = useState(false);
  const [measCountConfirm, setMeasCountConfirm] = useState<{
    open: boolean; goalId: string; count: number; applyFuture: boolean;
    fromCount: number;
  }>({ open: false, goalId: "", count: 0, applyFuture: false, fromCount: 0 });

  const handleMeasCountSaveConfirm = async () => {
    const { goalId, count, applyFuture } = measCountConfirm;
    setMeasCountConfirm((s) => ({ ...s, open: false }));
    await doMeasCountSave(goalId, count, applyFuture);
  };

  const doMeasCountSave = async (goalId: string, count: number, applyFuture: boolean) => {
    if (!goalId) return;
    try {
      await updateGoalMeasurementCount(goalId, count, applyFuture);
      setMeasCountApplyFuture(false);
      setMeasCountModal((s) => ({ ...s, open: false }));
      setManualMeasCounts((s) => ({ ...s, [goalId]: count }));
      setMeasDrafts((s) => {
        const goalDrafts = { ...(s[goalId] ?? {}) };
        for (let i = 1; i <= count; i++) {
          if (!goalDrafts[i]) {
            goalDrafts[i] = { result: null, measuredAt: null, observation: "", isIgnore: false };
          }
        }
        return { ...s, [goalId]: goalDrafts };
      });
      if (applyFuture) {
        for (const r of rows) {
          if (!r.id) continue;
          if (r.id === goalId) continue;
          const rMonthIdx = r.year * 12 + r.month;
          const goalMonthIdx = measCountModal.year * 12 + measCountModal.month;
          if (rMonthIdx > goalMonthIdx) {
            setManualMeasCounts((prev) => ({ ...prev, [r.id!]: count }));
            setMeasDrafts((s) => {
              const d = { ...(s[r.id!] ?? {}) };
              for (let i = 1; i <= count; i++) {
                if (!d[i]) d[i] = { result: null, measuredAt: null, observation: "", isIgnore: false };
              }
              return { ...s, [r.id!]: d };
            });
          }
        }
      }
      await qc.refetchQueries({ queryKey: ["objectives", "ico-board"] });
      toast.success("Cantidad de mediciones actualizada");
      onOpenChange(false);
    } catch (e) {
      toast.error(getHumanErrorMessage(e));
    }
  };

  const handleMeasCountSave = () => {
    const { goalId, currentCount } = measCountModal;
    if (!goalId) return;
    const current = manualMeasCounts[goalId] ?? measCountModal.currentCount;
    if (currentCount < current) {
      setMeasCountConfirm({
        open: true,
        goalId,
        count: currentCount,
        applyFuture: measCountApplyFuture,
        fromCount: current,
      });
      return;
    }
    doMeasCountSave(goalId, currentCount, measCountApplyFuture);
  };

  const handleUpdate = async () => {
    if (rowsMissingObs.length > 0) {
      const faltantes = rowsMissingObs
        .map((p) => `${monthName(p.month)}-${p.year}`)
        .join(", ");
      toast.error(
        `Debes ingresar una observación para el cambio de meta en: ${faltantes}`,
      );
      return;
    }

    // VALIDACIÓN DE CONSISTENCIA (Base vs Meta)
    const tendence = objective?.indicator?.tendence;
    if (tendence === "POS" || tendence === "NEG") {
      for (const p of rows) {
        // Validamos si se está modificando meta o base, o si ya existen valores que causen conflicto
        const goal = adjustedGoalOf(p);
        const base = adjustedBaseOf(p);

        if (typeof goal === "number" && typeof base === "number") {
          if (tendence === "POS" && base >= goal) {
            toast.error(
              `Mes ${monthName(
                p.month,
              )}: En tendencia CRECIENTE, la Meta (${goal}) debe ser mayor que la Línea Base (${base}).`,
            );
            return;
          }
          if (tendence === "NEG" && base < goal) {
            toast.error(
              `Mes ${monthName(
                p.month,
              )}: En tendencia DECRECIENTE, la Meta (${goal}) debe ser menor o igual que la Línea Base (${base}).`,
            );
            return;
          }
        }
      }
    }

    const hasMeasChangesForGoal = (goalId: string) => {
      const drafts = measDrafts[goalId];
      const originals = measurements[goalId] ?? [];
      if (!drafts) return false;
      const keys = Object.keys(drafts);
      if (keys.length === 0) return false;
      return keys.some((key) => {
        const d = drafts[key];
        const o = originals.find(
          (m: any) => m.id === key || String(m.index) === key,
        );
        if (!o) return true;
        if (d.result !== (o.result ? Number(o.result) : null)) return true;
        if (d.isIgnore !== o.isIgnore) return true;
        if (
          d.measuredAt !==
          (o.measuredAt ? o.measuredAt.slice(0, 10) : undefined)
        )
          return true;
        return false;
      });
    };

    // Guardar mediciones internas si aplica
    if (weeklyConfig) {
      for (const p of rows) {
        if (!p.id) continue;
        const goalDrafts = measDrafts[p.id];
        if (!goalDrafts) continue;
        if (!hasMeasChangesForGoal(p.id)) continue;
        const goalMeas = measurements[p.id] ?? [];
        const measArr: Array<{
          index: number;
          result?: number | null;
          measuredAt?: string;
          observation?: string | null;
          isIgnore?: boolean;
        }> = [];
        const goalMeasCount = manualMeasCounts[p.id!] ?? (p as any).measurementCount ?? objective?.indicator?.measurementCount ?? 4;
        for (let idx = 0; idx < goalMeasCount; idx++) {
          const i = idx + 1;
          const existing = goalMeas.find((m: any) => m.index === i);
          const draftKey = existing?.id ?? i;
          const draft = goalDrafts[draftKey];
          if (!draft && !existing) continue;
          const draftResult = draft?.result;
          const hasResult = draftResult != null || existing?.result != null;
          if (!hasResult && !draft) continue;
          if (draft !== undefined && draftResult === null) {
            measArr.push({ index: i, result: null });
            continue;
          }
          measArr.push({
            index: i,
            result: draftResult ?? existing?.result,
            measuredAt: draft?.measuredAt || undefined,
            observation: draft?.observation || null,
            isIgnore: draft?.isIgnore ?? false,
          });
        }
        if (measArr.length === 0) continue;
        try {
          await saveMeasurements(p.id, measArr);
        } catch (e) {
          toast.error(
            `Error en ${monthName(p.month)}: ${getHumanErrorMessage(e)}`,
          );
          return;
        }
      }
      qc.invalidateQueries({ queryKey: ["objectives", "ico-board"] });
    }

    if (hasChanges) onUpdate?.(changes);
    setDraftReal({});
    setDraftGoal({});
    setDraftBase({});
    setDraftObs({});
    onOpenChange(false);
  };

  // Datos resumen
  const objName = objective?.name ?? "—";
  const indName = objective?.indicator?.name ?? "—";
  const measurement = objective?.indicator?.measurement?.toUpperCase?.();
  const tendence = objective?.indicator?.tendence?.toUpperCase?.();
  const frequency = objective?.indicator?.frequency?.toUpperCase?.();
  const baseObjectiveGoal =
    typeof objective?.goalValue === "number" ? objective.goalValue : null;

  const measurementLabel =
    (measurement && MEASUREMENT_LABEL[measurement]) || "—";
  const tendenceLabel = (tendence && TENDENCE_LABEL[tendence]) || "—";
  const frequencyLabel = (frequency && FREQUENCY_LABEL[frequency]) || "—";
  const periodicityLabel = objective?.indicator?.periodicity
    ? (PERIODICITY_LABEL[objective.indicator.periodicity] ??
      objective.indicator.periodicity)
    : null;
  const calcMethodLabel = objective?.indicator?.calculationMethod
    ? (CALCULATION_METHOD_LABEL[objective.indicator.calculationMethod] ??
      objective.indicator.calculationMethod)
    : null;

  const loadMeasurements = useCallback(
    async (goalId: string) => {
      if (!goalId || !weeklyConfig) return;
      setLoadingMeas((s) => ({ ...s, [goalId]: true }));
      try {
        const data = await getMeasurements(goalId);
        setMeasurements((s) => ({ ...s, [goalId]: data }));
        const drafts: Record<string, any> = {};
        const existingIds = new Set((data ?? []).map((m: any) => m.id ?? m.index));
        (data ?? []).forEach((m: any) => {
          drafts[m.id ?? m.index] = {
            result: m.result != null ? Number(m.result) : null,
            measuredAt: m.measuredAt
              ? m.measuredAt.slice(0, 10)
              : dayjs().format("YYYY-MM-DD"),
            observation: m.observation ?? "",
            isIgnore: m.isIgnore ?? false,
          };
        });
        const goalMeasCount = manualMeasCounts[goalId] ?? (data as any)?.measurementCount ?? objective?.indicator?.measurementCount ?? 4;
        for (let i = 1; i <= goalMeasCount; i++) {
          if (!existingIds.has(i)) {
            drafts[i] = { result: null, measuredAt: null, observation: "", isIgnore: false };
          }
        }
        setMeasDrafts((s) => ({ ...s, [goalId]: drafts }));
      } catch {
        // silent
      } finally {
        setLoadingMeas((s) => ({ ...s, [goalId]: false }));
      }
    },
    [weeklyConfig],
  );

  useEffect(() => {
    if (!open) {
      setMeasInitialLoaded(false);
      setManualMeasCounts({});
      return;
    }
    if (!weeklyConfig) return;
    Promise.all(
      rows.map((p) => (p.id ? loadMeasurements(p.id) : Promise.resolve())),
    ).then(() => setMeasInitialLoaded(true));
  }, [open, weeklyConfig, rows, loadMeasurements]);

  // Precargar metas ajustadas/observaciones del backend al abrir
  useEffect(() => {
    if (!open) return;
    const initialGoals: Record<string, number | null> = {};
    const initialObs: Record<string, string> = {};

    (icoMonthly ?? []).forEach((p) => {
      const k = keyOf(p);
      const ng = (p as any)?.newGoalValue;
      if (typeof ng === "number") initialGoals[k] = ng;
      const ob = (p as any)?.observation;
      if (typeof ob === "string" && ob.trim() !== "") initialObs[k] = ob;
    });

    setDraftGoal(initialGoals);
    setDraftObs(initialObs);
  }, [open, icoMonthly]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : handleCancel())}
    >
      <DialogContent className="w-[95vw] sm:max-w-[1000px] md:max-w-[1300px] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* ---------- Tarjeta resumen objetivo/indicador ---------- */}
          <div className="rounded-xl border bg-card text-card-foreground p-5 mb-4">
            <div className="grid gap-6 md:grid-cols-4">
              {/* 3/4: Objetivo + Indicador */}
              <div className="md:col-span-3 space-y-4">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">
                    Objetivo
                  </div>
                  <div className="text-sm leading-snug break-words whitespace-pre-wrap">
                    {objName}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">
                    Indicador
                  </div>
                  <div className="text-sm leading-snug break-words whitespace-pre-wrap">
                    {indName}
                  </div>
                </div>
              </div>

              {/* 1/4: Unidad / Tendencia / Frecuencia / Meta */}
              <div className="md:col-span-1">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Medida
                    </span>
                    <span className="text-xs px-2 py-1 rounded-md border bg-muted/40">
                      {measurementLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Tendencia
                    </span>
                    <span className="text-xs px-2 py-1 rounded-md border bg-muted/40">
                      {tendenceLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Frecuencia
                    </span>
                    <span className="text-xs px-2 py-1 rounded-md border bg-muted/40">
                      {frequencyLabel}
                    </span>
                  </div>
                  {/* 🔹 Meta del objetivo */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Meta
                    </span>
                    <span className="text-xs px-2 py-1 rounded-md border bg-muted/40">
                      {baseObjectiveGoal ?? "—"}
                    </span>
                  </div>
                  {weeklyConfig && periodicityLabel && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Periodicidad
                      </span>
                      <span className="text-xs px-2 py-1 rounded-md border bg-muted/40">
                        {periodicityLabel}
                      </span>
                    </div>
                  )}
                  {weeklyConfig && calcMethodLabel && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Método
                      </span>
                      <span className="text-xs px-2 py-1 rounded-md border bg-muted/40">
                        {calcMethodLabel}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* -------------- Tabla -------------- */}
          <div className="w-full overflow-x-auto">
            <Table className="w-full min-w-[1100px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20 text-center whitespace-nowrap">
                    Año
                  </TableHead>
                  <TableHead className="w-28 text-center whitespace-nowrap">
                    Mes
                  </TableHead>
                  <TableHead className="w-28 text-center whitespace-nowrap">
                    ICO
                  </TableHead>
                  <TableHead className="w-40 text-center whitespace-nowrap">
                    Resultado
                  </TableHead>
                  <TableHead className="w-44 text-center whitespace-nowrap">
                    Valor esperado
                  </TableHead>
                  <TableHead className="w-32 text-center whitespace-nowrap">
                    Línea Base
                  </TableHead>
                  <TableHead className="w-44 text-center whitespace-nowrap">
                    Variación %
                  </TableHead>
                  <TableHead className="w-72 whitespace-nowrap">
                    Observación
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Acciones a realizar
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((p) => {
                  const k = keyOf(p);
                  const bg = p.lightColorHex ?? undefined;

                  const hasMeasurements = weeklyConfig && p.id != null;
                  const goalDrafts = hasMeasurements ? measDrafts[p.id!] : null;

                  // Consolidar desde mediciones internas si aplica
                  let consolidatedReal: number | null = null;
                  if (goalDrafts && calcMethod) {
                    const vals = Object.values(goalDrafts)
                      .filter((m: any) => m.result != null && !m.isIgnore)
                      .map((m: any) => Number(m.result));
                    if (vals.length > 0) {
                      if (calcMethod === "ACCUMULATIVE") {
                        consolidatedReal = vals.reduce((a, b) => a + b, 0);
                      } else if (calcMethod === "AVERAGE") {
                        consolidatedReal =
                          vals.reduce((a, b) => a + b, 0) / vals.length;
                      } else if (calcMethod === "LAST_VALUE") {
                        consolidatedReal = vals[vals.length - 1];
                      }
                    }
                  }

                  const editedReal = getDraftReal(p);
                  const realToShow = hasMeasurements
                    ? consolidatedReal
                    : editedReal !== undefined
                      ? editedReal
                      : typeof p.realValue === "number"
                        ? p.realValue
                        : null;

                  // Valor esperado visible (ajustado)
                  const goalToShow = adjustedGoalOf(p);

                  // Línea Base visible (ajustada)
                  const baseToShow = adjustedBaseOf(p);

                  // Variación % = (Meta del Objetivo - Valor Esperado visible) / Meta del Objetivo * 100
                  const varPct =
                    baseObjectiveGoal != null &&
                    baseObjectiveGoal !== 0 &&
                    goalToShow != null
                      ? ((baseObjectiveGoal - goalToShow) / baseObjectiveGoal) *
                        100
                      : null;
                  const varLabel =
                    varPct == null ? "—" : `${varPct.toFixed(2)}%`;

                  const obs = getDraftObs(p);
                  const obsRequired = goalChanged(p) && !obs.trim();

                  return (
                    <React.Fragment key={k}>
                      <TableRow>
                        <TableCell className="text-center align-middle">
                          {p.year}
                        </TableCell>
                        <TableCell className="text-center align-middle">
                          {monthName(p.month)}
                        </TableCell>

                        {/* ICO desde backend */}
                        <TableCell className="text-center align-middle">
                          <Badge
                            className="whitespace-nowrap border-0"
                            style={{ backgroundColor: bg, color: "#000" }}
                            title={p.ico != null ? `${p.ico}%` : undefined}
                          >
                            {p.ico != null ? `${p.ico}%` : "—"}
                          </Badge>
                        </TableCell>

                        {/* Resultado */}
                        <TableCell className="text-center align-middle">
                          <Input
                            type="number"
                            inputMode="decimal"
                            className={`h-8 text-center ${hasMeasurements ? "bg-gray-100" : ""}`}
                            value={realToShow != null ? realToShow : ""}
                            onChange={(e) =>
                              handleChangeReal(p, e.target.value)
                            }
                            placeholder="—"
                            disabled={
                              hasMeasurements || !permissions.updateCompliance
                            }
                          />
                        </TableCell>

                        {/* Valor esperado (editable) */}
                        <TableCell className="text-center align-middle">
                          <Input
                            type="number"
                            inputMode="decimal"
                            className="h-8 text-center"
                            value={goalToShow ?? ""}
                            onChange={(e) =>
                              handleChangeGoal(p, e.target.value)
                            }
                            placeholder="—"
                            disabled={!permissions.updateTargetValue}
                          />
                        </TableCell>

                        {/* Línea Base (editable) */}
                        <TableCell className="text-center align-middle">
                          <Input
                            type="number"
                            inputMode="decimal"
                            className="h-8 text-center"
                            value={baseToShow ?? ""}
                            onChange={(e) =>
                              handleChangeBase(p, e.target.value)
                            }
                            placeholder="—"
                            disabled={!permissions.updateBaseValue}
                          />
                        </TableCell>

                        {/* Variación % */}
                        <TableCell className="text-center align-middle">
                          {varLabel}
                        </TableCell>

                        {/* Observación (requerida si cambió la meta mensual) */}
                        <TableCell className="align-middle">
                          <div className="flex flex-col gap-1">
                            <Input
                              type="text"
                              className="h-8"
                              value={obs}
                              onChange={(e) =>
                                handleChangeObs(p, e.target.value)
                              }
                              placeholder={
                                goalChanged(p)
                                  ? "Explica por qué se ajustó la meta (obligatorio)"
                                  : "Opcional"
                              }
                            />
                            {obsRequired && (
                              <span className="text-xs text-destructive">
                                Obligatorio: explica el cambio de meta.
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Acciones (solo lectura) */}
                        <TableCell className="align-top">
                          <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                            {p.action ?? "—"}
                          </div>
                          {weeklyConfig && p.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="mt-1 h-6 w-6"
                              title="Configurar cantidad de mediciones"
                              onClick={() =>
                                setMeasCountModal({
                                  open: true,
                                  goalId: p.id!,
                                  month: p.month,
                                  year: p.year,
                                  currentCount: manualMeasCounts[p.id!] ?? (p as any).measurementCount ?? (objective?.indicator?.measurementCount ?? 4),
                                })
                              }
                            >
                              <Settings className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Sub-filas de mediciones internas (solo si configurado) */}
                      {weeklyConfig && p.id && (
                        <TableRow key={`${k}-meas`}>
                          <TableCell colSpan={9} className="bg-gray-50/70 p-3">
                            {loadingMeas[p.id] || !measInitialLoaded ? (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Cargando mediciones…
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
                                  <div className="col-span-1">#</div>
                                  <div className="col-span-2">Resultado</div>
                                  <div className="col-span-2">Fecha</div>
                                  <div className="col-span-5">Observación</div>
                                  <div className="col-span-2 text-center">
                                    No considerar
                                  </div>
                                </div>
                                {Array.from({ length: manualMeasCounts[p.id!] ?? p.measurementCount ?? objective?.indicator?.measurementCount ?? 4 }, (_, idx) => {
                                  const i = idx + 1;
                                  const goalMeas = measurements[p.id!];
                                  const existing = goalMeas?.find(
                                    (m: any) => m.index === i,
                                  );
                                  const draftKey = existing?.id ?? i;
                                  const drafts = measDrafts[p.id!] ?? {};
                                  const draft = drafts[draftKey];
                                  const hasDraft = draft !== undefined;
                                  const resultVal = hasDraft
                                    ? (draft.result ?? null)
                                    : (existing?.result ?? null);
                                  const existingDate = existing?.measuredAt
                                    ? existing.measuredAt.slice(0, 10)
                                    : "";
                                  const dateVal = hasDraft
                                    ? (draft.measuredAt ?? null)
                                    : resultVal != null
                                      ? existingDate
                                      : "";
                                  const obsVal =
                                    draft?.observation ??
                                    existing?.observation ??
                                    "";
                                  const resultEmpty = resultVal == null;
                                  const ignoreVal =
                                    draft?.isIgnore ??
                                    existing?.isIgnore ??
                                    false;
                                  const monthStart = `${p.year}-${String(p.month).padStart(2, "0")}-01`;
                                  const monthEnd = new Date(p.year, p.month, 0)
                                    .toISOString()
                                    .slice(0, 10);
                                  let prevDate: string | null = null;
                                  if (i > 1) {
                                    for (let pIdx = i - 1; pIdx >= 1; pIdx--) {
                                      const pExist = goalMeas?.find(
                                        (m: any) => m.index === pIdx,
                                      );
                                      const pKey = pExist?.id ?? pIdx;
                                      const pDate =
                                        drafts[pKey]?.measuredAt ??
                                        pExist?.measuredAt?.slice(0, 10) ??
                                        null;
                                      if (pDate) {
                                        prevDate = pDate;
                                        break;
                                      }
                                    }
                                  }

                                  const updateMeas = (
                                    field: string,
                                    value: any,
                                  ) => {
                                    setMeasDrafts((s) => ({
                                      ...s,
                                      [p.id!]: {
                                        ...(s[p.id!] ?? {}),
                                        [draftKey]: {
                                          ...((s[p.id!] ?? {})[draftKey] ?? {}),
                                          [field]: value,
                                        },
                                      },
                                    }));
                                  };

                                  return (
                                    <div
                                      key={i}
                                      className={`grid grid-cols-12 gap-2 items-center px-2 py-1.5 rounded-md ${
                                        ignoreVal
                                          ? "bg-gray-100 opacity-60"
                                          : ""
                                      }`}
                                    >
                                      <div className="col-span-1 text-xs text-muted-foreground">
                                        {i}
                                      </div>
                                      <div className="col-span-2">
                                        <Input
                                          type="number"
                                          inputMode="decimal"
                                          className="h-7 text-xs"
                                          value={resultVal ?? ""}
                                          onChange={(e) => {
                                            const v = e.target.value;
                                            const isClear = v === "";
                                            const newResult = isClear
                                              ? null
                                              : Number(v);
                                            updateMeas("result", newResult);
                                            if (isClear) {
                                              updateMeas("measuredAt", null);
                                            } else if (
                                              !draft?.measuredAt &&
                                              !existingDate
                                            ) {
                                              updateMeas(
                                                "measuredAt",
                                                monthEnd,
                                              );
                                            }
                                          }}
                                          disabled={
                                            ignoreVal ||
                                            !permissions.updateCompliance
                                          }
                                        />
                                      </div>
                                      <div className="col-span-2">
                                        <Input
                                          type="date"
                                          className={`h-7 text-xs ${prevDate && dateVal && dateVal < prevDate ? "border-red-400" : ""}`}
                                          value={dateVal ?? ""}
                                          min={monthStart}
                                          max={monthEnd}
                                          onChange={(e) =>
                                            updateMeas(
                                              "measuredAt",
                                              e.target.value,
                                            )
                                          }
                                          disabled={
                                            ignoreVal ||
                                            !permissions.updateCompliance ||
                                            resultEmpty
                                          }
                                        />
                                        {prevDate &&
                                          dateVal &&
                                          dateVal < prevDate && (
                                            <p className="text-xs font-semibold text-red-600 mt-1 leading-tight">
                                               Debe ser ≥ {prevDate.split("-").reverse().join("/")}
                                            </p>
                                          )}
                                      </div>
                                      <div className="col-span-5">
                                        <Input
                                          type="text"
                                          className="h-7 text-xs"
                                          maxLength={300}
                                          value={obsVal}
                                          onChange={(e) =>
                                            updateMeas(
                                              "observation",
                                              e.target.value,
                                            )
                                          }
                                          disabled={
                                            ignoreVal ||
                                            !permissions.updateCompliance ||
                                            resultEmpty
                                          }
                                          placeholder="Observación (opcional)"
                                        />
                                      </div>
                                      <div className="col-span-2 flex justify-center">
                                        <Checkbox
                                          checked={ignoreVal}
                                          onCheckedChange={(c) =>
                                            updateMeas("isIgnore", !!c)
                                          }
                                          disabled={
                                            !permissions.updateCompliance ||
                                            resultEmpty
                                          }
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}

                {rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-sm text-muted-foreground"
                    >
                      No hay meses medidos para este objetivo.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter className="gap-2 px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={handleCancel}>
            Cerrar
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={!hasChanges || rowsMissingObs.length > 0}
            className="btn-gradient"
          >
            Actualizar
          </Button>
        </DialogFooter>
      </DialogContent>

      <Dialog
        open={measCountModal.open}
        onOpenChange={(next) =>
          !next &&
          setMeasCountModal((s) => ({ ...s, open: false }))
        }
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Mediciones de {monthName(measCountModal.month)} {measCountModal.year}
            </DialogTitle>
            <DialogDescription>
              Cambia la cantidad de mediciones para este mes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Label className="w-40 text-sm font-medium">
                Cantidad de mediciones
              </Label>
              <Input
                type="number"
                min={2}
                max={50}
                className="w-24 h-9 text-center"
                value={measCountModal.currentCount}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  if (isNaN(v)) return;
                  setMeasCountModal((s) => ({
                    ...s,
                    currentCount: Math.min(50, Math.max(2, v)),
                  }));
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="applyToFuture"
                checked={measCountApplyFuture}
                onCheckedChange={(c) =>
                  setMeasCountApplyFuture(c === true)
                }
              />
              <Label htmlFor="applyToFuture" className="cursor-pointer text-sm">
                Aplicar a meses futuros
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setMeasCountModal((s) => ({ ...s, open: false }))
              }
            >
              Cancelar
            </Button>
            <Button
              className="btn-gradient"
              onClick={handleMeasCountSave}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmModal
        open={measCountConfirm.open}
        onCancel={() => setMeasCountConfirm((s) => ({ ...s, open: false }))}
        onConfirm={handleMeasCountSaveConfirm}
        title="Reducir cantidad de mediciones"
        message={`Al reducir la cantidad de mediciones de ${measCountConfirm.fromCount} a ${measCountConfirm.count}, se conservarán las últimas ${measCountConfirm.count} mediciones registradas y se eliminarán las sobrantes, y se recalculará. ¿Desea continuar?`}
        confirmText="Sí, reducir"
      />
    </Dialog>
  );
}
