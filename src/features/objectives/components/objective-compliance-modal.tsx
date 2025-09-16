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

/* ---------------- props ---------------- */
export type ObjectiveComplianceChange = {
  id?: string;
  month: number;
  year: number;
  realValue: number | null;
};

type ObjectiveHeader = {
  name?: string | null;
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
  objective, // info para la tarjeta resumen
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

  // Estado local de ediciones
  const [draft, setDraft] = useState<Record<string, number | null>>({});
  const keyOf = (p: IcoMonthlyPoint) => p.id ?? `${p.year}-${p.month}`;
  const getDraftValue = (p: IcoMonthlyPoint): number | null | undefined =>
    draft[keyOf(p)];
  const handleChange = (p: IcoMonthlyPoint, val: string) => {
    const num = val === "" ? null : Number(val);
    if (val !== "" && Number.isNaN(num)) return;
    setDraft((d) => ({ ...d, [keyOf(p)]: num }));
  };

  const changes: ObjectiveComplianceChange[] = useMemo(() => {
    const arr: ObjectiveComplianceChange[] = [];
    for (const p of rows) {
      const k = keyOf(p);
      if (Object.prototype.hasOwnProperty.call(draft, k)) {
        arr.push({
          id: p.id,
          month: p.month,
          year: p.year,
          realValue: draft[k] ?? null,
        });
      }
    }
    return arr;
  }, [rows, draft]);
  const hasChanges = changes.length > 0;

  const handleCancel = () => {
    setDraft({});
    onOpenChange(false);
  };
  const handleUpdate = () => {
    if (hasChanges) onUpdate?.(changes);
    setDraft({});
    onOpenChange(false);
  };

  // Datos resumen
  const objName = objective?.name ?? "—";
  const indName = objective?.indicator?.name ?? "—";
  const measurement = objective?.indicator?.measurement?.toUpperCase?.();
  const tendence = objective?.indicator?.tendence?.toUpperCase?.();
  const frequency = objective?.indicator?.frequency?.toUpperCase?.();

  const measurementLabel =
    (measurement && MEASUREMENT_LABEL[measurement]) || "—";
  const tendenceLabel = (tendence && TENDENCE_LABEL[tendence]) || "—";
  const frequencyLabel = (frequency && FREQUENCY_LABEL[frequency]) || "—";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : handleCancel())}
    >
      {/* usa tu variant size="xl" configurado en ui/dialog.tsx */}
      <DialogContent className="w-[95vw] sm:max-w-[1000px] md:max-w-[1300px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* ---------- Tarjeta resumen objetivo/indicador (3/4 - 1/4, pills compactas) ---------- */}
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

            {/* 1/4: Unidad / Tendencia / Frecuencia (labels + valor pegados) */}
            <div className="md:col-span-1">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Unidad
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
              </div>
            </div>
          </div>
        </div>

        {/* -------------- Tabla de meses medidos -------------- */}
        <div className="w-full overflow-x-auto">
          <Table className="w-full min-w-[860px]">
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
                <TableHead className="w-40 text-center whitespace-nowrap">
                  Valor esperado
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  Acciones a realizar
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((p) => {
                const bg = p.lightColorHex ?? undefined;
                const edited = getDraftValue(p);
                const valueToShow =
                  edited !== undefined
                    ? edited
                    : typeof p.realValue === "number"
                    ? p.realValue
                    : null;

                return (
                  <TableRow key={p.id ?? `${p.year}-${p.month}`}>
                    <TableCell className="text-center align-middle">
                      {p.year}
                    </TableCell>

                    {/* Mes con nombre */}
                    <TableCell className="text-center align-middle">
                      {monthName(p.month)}
                    </TableCell>

                    {/* ✅ ICO tal cual viene del backend; color de fondo desde lightColorHex */}
                    <TableCell className="text-center align-middle">
                      <Badge
                        className="whitespace-nowrap border-0"
                        style={{ backgroundColor: bg, color: "#000" }}
                        title={p.ico != null ? `${p.ico}%` : undefined}
                      >
                        {p.ico != null ? `${p.ico}%` : "—"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center align-middle">
                      <Input
                        type="number"
                        inputMode="decimal"
                        className="h-8 text-center"
                        value={valueToShow ?? ""}
                        onChange={(e) => handleChange(p, e.target.value)}
                        placeholder="—"
                      />
                    </TableCell>

                    <TableCell className="text-center align-middle">
                      {typeof p.goalValue === "number" ? p.goalValue : "—"}
                    </TableCell>

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
                  {/* ahora hay 6 columnas */}
                  <TableCell
                    colSpan={6}
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
            disabled={!hasChanges}
            className="btn-gradient"
          >
            Actualizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
