"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import type { IcoMonthlyPoint } from "@/features/objectives/types/ico-board";

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
  observation?: string | null;
  variationPct?: number | null; // expresado en %
};

type ObjectiveHeader = {
  name?: string | null;
  goalValue?: number | null; // ⚠️ Meta del objetivo (base para la variación)
  indicator?: {
    name?: string | null;
    measurement?: string | null;
    tendence?: string | null;
    frequency?: string | null;
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
  // Solo meses medidos
  const rows = useMemo(
    () => (icoMonthly ?? []).filter((p) => p.isMeasured),
    [icoMonthly]
  );

  // ===== Estado local
  const [draftReal, setDraftReal] = useState<Record<string, number | null>>({});
  const [draftGoal, setDraftGoal] = useState<Record<string, number | null>>({});
  const [draftObs, setDraftObs] = useState<Record<string, string>>({});

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

  /** ¿la meta mensual cambió respecto a su base (p.goalValue)? */
  const goalChanged = (p: IcoMonthlyPoint) => {
    const base = typeof p.goalValue === "number" ? p.goalValue : null;
    const adj = adjustedGoalOf(p);
    return (adj ?? null) !== (base ?? null);
  };

  // Filas que requieren observación (meta cambiada sin texto)
  const rowsMissingObs = rows.filter(
    (p) => goalChanged(p) && !getDraftObs(p).trim()
  );

  // ¿hay algún cambio en resultado o meta?
  const hasAnyRealChange = rows.some((p) =>
    Object.prototype.hasOwnProperty.call(draftReal, keyOf(p))
  );
  const hasAnyGoalChange = rows.some(goalChanged);
  const hasChanges = hasAnyRealChange || hasAnyGoalChange;

  // Payload de cambios (incluye variación calculada con objective.goalValue)
  const changes: ObjectiveComplianceChange[] = useMemo(() => {
    const baseObjectiveGoal =
      typeof objective?.goalValue === "number" ? objective.goalValue : null;

    const out: ObjectiveComplianceChange[] = [];
    for (const p of rows) {
      const k = keyOf(p);
      const realTouched = Object.prototype.hasOwnProperty.call(draftReal, k);
      const metaTouched = goalChanged(p);
      if (!realTouched && !metaTouched) continue;

      const finalReal = realTouched
        ? draftReal[k] ?? null
        : p.realValue ?? null;

      const shownGoal = adjustedGoalOf(p);

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
        observation: metaTouched ? getDraftObs(p) : undefined,
        variationPct: varPct,
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, draftReal, draftGoal, draftObs, objective?.goalValue]);

  const handleCancel = () => {
    setDraftReal({});
    setDraftGoal({});
    setDraftObs({});
    onOpenChange(false);
  };

  const handleUpdate = () => {
    if (rowsMissingObs.length > 0) {
      const faltantes = rowsMissingObs
        .map((p) => `${monthName(p.month)}-${p.year}`)
        .join(", ");
      toast.error(
        `Debes ingresar una observación para el cambio de meta en: ${faltantes}`
      );
      return;
    }
    if (hasChanges) onUpdate?.(changes);
    setDraftReal({});
    setDraftGoal({});
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

  // Precargar metas ajustadas/observaciones del backend al abrir
  React.useEffect(() => {
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
      <DialogContent className="w-[95vw] sm:max-w-[1000px] md:max-w-[1300px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

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

                // Resultado (editable) — lo seguimos mostrando pero ya no entra en el cálculo.
                const editedReal = getDraftReal(p);
                const realToShow =
                  editedReal !== undefined
                    ? editedReal
                    : typeof p.realValue === "number"
                    ? p.realValue
                    : null;

                // Valor esperado visible (ajustado)
                const goalToShow = adjustedGoalOf(p);

                // Variación % = (Meta del Objetivo - Valor Esperado visible) / Meta del Objetivo * 100
                const varPct =
                  baseObjectiveGoal != null &&
                  baseObjectiveGoal !== 0 &&
                  goalToShow != null
                    ? ((baseObjectiveGoal - goalToShow) / baseObjectiveGoal) *
                      100
                    : null;
                const varLabel = varPct == null ? "—" : `${varPct.toFixed(2)}%`;

                const obs = getDraftObs(p);
                const obsRequired = goalChanged(p) && !obs.trim();

                return (
                  <TableRow key={k}>
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

                    {/* Resultado (editable, independiente del cálculo de variación) */}
                    <TableCell className="text-center align-middle">
                      <Input
                        type="number"
                        inputMode="decimal"
                        className="h-8 text-center"
                        value={realToShow ?? ""}
                        onChange={(e) => handleChangeReal(p, e.target.value)}
                        placeholder="—"
                      />
                    </TableCell>

                    {/* Valor esperado (editable) */}
                    <TableCell className="text-center align-middle">
                      <Input
                        type="number"
                        inputMode="decimal"
                        className="h-8 text-center"
                        value={goalToShow ?? ""}
                        onChange={(e) => handleChangeGoal(p, e.target.value)}
                        placeholder="—"
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
                          onChange={(e) => handleChangeObs(p, e.target.value)}
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
                    </TableCell>
                  </TableRow>
                );
              })}

              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-sm text-muted-foreground"
                  >
                    No hay meses medidos para este objetivo.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="gap-2">
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
    </Dialog>
  );
}
