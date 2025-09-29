"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  CheckCircle,
  Target,
  Map,
  Rocket,
  Settings,
  StickyNote,
} from "lucide-react";

import type {
  IcoBoardData,
  IcoBoardListItem,
} from "@/features/objectives/types/ico-board";
import { NewObjectiveModal, NewObjectivePayload } from "./new-objective-modal";
import {
  ObjectiveComplianceChange,
  ObjectiveComplianceModal,
} from "./objective-compliance-modal";
import type { UnconfiguredObjective } from "@/features/strategic-plans/types/objectives";
import NotesModal from "@/shared/components/comments/components/notes-modal";
import ObjectiveConfigureModal, {
  ObjectiveConfigureData,
} from "./objective-configure-modal";

/* --------------------- utils --------------------- */
const LEVEL_LABEL: Record<string, string> = {
  EST: "Estratégico",
  OPE: "Operativo",
};
const TYPE_LABEL: Record<string, string> = { RES: "Resultado", GES: "Gestión" };

function normalizeLevel(v?: string | null) {
  return v ? LEVEL_LABEL[(v as string).toUpperCase()] ?? v : "—";
}
function normalizeType(v?: string | null) {
  return v ? TYPE_LABEL[(v as string).toUpperCase()] ?? v : "—";
}

function textColorForBg(hex?: string | null): string | undefined {
  if (!hex || !/^#?[0-9a-fA-F]{6}$/.test(hex)) return undefined;
  const h = hex.startsWith("#") ? hex.slice(1) : hex;
  const r = parseInt(h.slice(0, 2), 16),
    g = parseInt(h.slice(2, 4), 16),
    b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#111827" : "#ffffff";
}

/* --------------------- tipos fila --------------------- */
type RowItem = {
  index: number;
  id: string;
  name: string;
  indicatorName: string;
  level: string;
  type: string;
  statusLabel: string;
  statusBg?: string;
  statusFg?: string;
};

/* --------------------- props --------------------- */
type ObjectivesComplianceProps = {
  data?: IcoBoardData;
  loading?: boolean;
  error?: boolean;
  onCreateObjective?: (payload: NewObjectivePayload) => void | Promise<void>;
  onComplianceUpdate?: (changes: ObjectiveComplianceChange[]) => void;
  canCreateObjective?: boolean;

  // NO configurados
  unconfigured?: UnconfiguredObjective[];
  loadingUnconfigured?: boolean;

  strategicPlanId: string;
  positionId: string;
  year?: number;
};

/* Colgroup compartido para ALINEAR AMBAS TABLAS */
function SharedColGroup() {
  return (
    <colgroup>
      <col style={{ width: "56px" }} />
      <col />
      <col style={{ width: "140px" }} />
      <col style={{ width: "140px" }} />
      <col style={{ width: "160px" }} />
      <col style={{ width: "240px" }} />
    </colgroup>
  );
}

// Toma los meses medidos de icoMonthly
function monthsFromIcoMonthly(icoMonthly: any[] = []) {
  return icoMonthly
    .filter((p) => p && p.isMeasured)
    .map((p) => ({
      month: Number(p.month),
      year: Number(p.year),
    }))
    .filter(
      (m) =>
        Number.isInteger(m.month) &&
        m.month >= 1 &&
        m.month <= 12 &&
        Number.isInteger(m.year)
    );
}

// Devuelve el primer registro que tenga al menos uno de los ranges
function firstWithRanges(icoMonthly: any[] = []) {
  return icoMonthly.find(
    (p) =>
      p &&
      (p.rangeExceptional !== undefined || p.rangeInacceptable !== undefined)
  );
}

/* --------------------- componente --------------------- */
export default function ObjectivesCompliance({
  data,
  loading,
  error,
  onCreateObjective,
  onComplianceUpdate,
  canCreateObjective,

  unconfigured = [],
  loadingUnconfigured = false,
  strategicPlanId,
  positionId,
  year,
}: ObjectivesComplianceProps) {
  /* --------- configurados / registrables --------- */
  const rows: IcoBoardListItem[] = data?.listObjectives ?? [];
  const [openCompliance, setOpenCompliance] = useState(false);
  const [selected, setSelected] = useState<IcoBoardListItem | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openConfigure, setOpenConfigure] = useState(false);
  const [configureData, setConfigureData] =
    useState<ObjectiveConfigureData | null>(null);
  const [notesForObjective, setNotesForObjective] = useState<string | null>(
    null
  );
  const openNotes = (objectiveId: string) => setNotesForObjective(objectiveId);
  const closeNotes = () => setNotesForObjective(null);

  const openComplianceFor = (objectiveId: string) => {
    const item = rows.find((it) => it.objective?.id === objectiveId) ?? null;
    setSelected(item);
    setOpenCompliance(true);
  };

  const configuredRows: RowItem[] = useMemo(
    () =>
      rows.map((it, idx): RowItem => {
        const o = it.objective;
        const indicator = o?.indicator;
        const gs = o?.goalStatus;

        const level = normalizeLevel(o?.level ?? undefined);
        const type = normalizeType(indicator?.type ?? undefined);
        const statusLabel = gs?.statusLabel || "—";
        const bg = gs?.lightColorHex ?? undefined;
        const fg = textColorForBg(bg);

        return {
          index: idx + 1,
          id: o?.id ?? String(idx),
          name: o?.name ?? "—",
          indicatorName: indicator?.name ?? "—",
          level,
          type,
          statusLabel,
          statusBg: bg,
          statusFg: fg,
        };
      }),
    [rows]
  );

  /* --------- no configurados (misma forma de tabla) --------- */
  const unconfRows: RowItem[] = useMemo(
    () =>
      unconfigured.map((o, idx) => {
        const indicatorName = o.indicator?.name ?? "—";
        return {
          index: idx + 1,
          id: o.id,
          name: o.name ?? "—",
          indicatorName,
          level: normalizeLevel(o.level),
          type: normalizeType(o.indicator?.type ?? undefined),
          statusLabel: "No configurado",
          statusBg: "#E5E7EB",
          statusFg: "#111827",
        };
      }),
    [unconfigured]
  );

  const totalConfigured = configuredRows.length;
  const totalUnconfigured = unconfRows.length;

  // Configurar desde la tabla de "configurados"
  const openConfigureFromConfigured = (objectiveId: string) => {
    const item = rows.find((it) => it.objective?.id === objectiveId);
    if (!item?.objective) return;

    const o = item.objective as any;
    const ind = (o.indicator ?? {}) as any;

    const icoMonthly: any[] = Array.isArray(o.icoMonthly) ? o.icoMonthly : [];
    const ranges = firstWithRanges(icoMonthly);

    const data: ObjectiveConfigureData = {
      objective: {
        id: o.id,
        name: o.name ?? null,
        description: o.description ?? null,
        perspective: o.perspective ?? null,
        level: o.level ?? null,
        valueOrientation: o.valueOrientation ?? null,
        objectiveParentId: o.objectiveParentId ?? null,
        positionId: o.positionId ?? null,
        strategicPlanId: o.strategicPlanId ?? null,
        goalValue: o.goalValue ?? null,
        status: o.status ?? null,
      },
      indicator: {
        id: ind.id ?? null,
        name: ind.name ?? null,
        description: ind.description ?? null,
        formula: ind.formula ?? null,
        origin: ind.origin ?? null,
        tendence: ind.tendence ?? null,
        frequency: ind.frequency ?? null,
        measurement: ind.measurement ?? null,
        type: ind.type ?? null,
        reference: ind.reference ?? null,
        periodStart: ind.periodStart ?? null,
        periodEnd: ind.periodEnd ?? null,
      },

      months: monthsFromIcoMonthly(icoMonthly),
      rangeExceptional: ranges?.rangeExceptional ?? undefined,
      rangeInacceptable: ranges?.rangeInacceptable ?? undefined,
      isNew: false,
    };

    setConfigureData(data);
    setOpenConfigure(true);
  };

  // Configurar desde la tabla de "no configurados"
  const openConfigureFromUnconfigured = (objectiveId: string) => {
    const u = unconfigured.find((x) => x.id === objectiveId) as any;
    if (!u) return;

    const ind = (u.indicator ?? {}) as any;

    const data: ObjectiveConfigureData = {
      objective: {
        id: u.id,
        name: u.name ?? null,
        description: u.description ?? null,
        perspective: u.perspective ?? null,
        level: u.level ?? null,
        valueOrientation: u.valueOrientation ?? null,
        objectiveParentId: u.objectiveParentId ?? null,
        positionId: u.positionId ?? null,
        strategicPlanId: u.strategicPlanId ?? null,
        goalValue: u.goalValue ?? null,
        status: u.status ?? null,
      },
      indicator: {
        id: ind.id ?? null,
        name: ind.name ?? null,
        description: ind.description ?? null,
        formula: ind.formula ?? null,
        origin: ind.origin ?? null,
        tendence: ind.tendence ?? null,
        frequency: ind.frequency ?? null,
        measurement: ind.measurement ?? null,
        type: ind.type ?? null,
        reference: ind.reference ?? null,
        periodStart: ind.periodStart ?? null,
        periodEnd: ind.periodEnd ?? null,
      },
      months: u.months ?? undefined,
      rangeExceptional: u.rangeExceptional ?? undefined,
      rangeInacceptable: u.rangeInacceptable ?? undefined,
      isNew: true,
    };

    setConfigureData(data);
    setOpenConfigure(true);
  };

  /* --------------------- render --------------------- */
  return (
    <Card className="w-full">
      {/* Header global */}
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
        <h2 className="text-base font-semibold">Objetivos</h2>
        <Button
          size="sm"
          className="h-9 btn-gradient"
          onClick={() => setOpenCreate(true)}
          disabled={canCreateObjective === false}
        >
          + Nuevo Objetivo
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <Accordion
          type="multiple"
          defaultValue={["configured", "unconfigured"]}
          className="w-full"
        >
          {/* ---------- Acordeón 1: Registrar cumplimiento ---------- */}
          <AccordionItem value="configured" className="border-b">
            <AccordionTrigger className="px-4 py-3 bg-muted/40 hover:no-underline">
              <div className="flex items-center gap-2">
                <span className="font-medium">Cumplimiento de objetivos</span>
                <Badge variant="secondary">{totalConfigured}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {loading ? (
                <Skeleton className="h-48 w-full" />
              ) : error ? (
                <div className="p-4 text-sm text-destructive">
                  No se pudo cargar la lista de objetivos.
                </div>
              ) : totalConfigured === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  No hay objetivos para los filtros seleccionados.
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <Table className="w-full min-w-[1000px]">
                    <SharedColGroup />
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center whitespace-nowrap px-2">
                          #
                        </TableHead>
                        <TableHead className="whitespace-nowrap px-2">
                          Objetivo
                        </TableHead>
                        <TableHead className="whitespace-nowrap text-center px-2">
                          Nivel
                        </TableHead>
                        <TableHead className="whitespace-nowrap text-center px-2">
                          Tipo
                        </TableHead>
                        <TableHead className="text-center whitespace-nowrap px-2">
                          Estado
                        </TableHead>
                        <TableHead className="whitespace-nowrap text-center sticky right-0 bg-background z-20 border-l px-2">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {configuredRows.map((r) => (
                        <TableRow key={r.id} className="align-top">
                          <TableCell className="text-center whitespace-nowrap align-top px-2 py-2">
                            {r.index}
                          </TableCell>

                          {/* objetivo + indicador */}
                          <TableCell className="align-top px-2 py-2">
                            <div className="font-medium leading-5 break-words whitespace-pre-wrap">
                              {r.name}
                            </div>
                            <div className="text-xs text-muted-foreground break-words whitespace-pre-wrap mt-0.5">
                              {r.indicatorName}
                            </div>
                          </TableCell>

                          <TableCell className="text-center align-center px-2 py-2">
                            <div className="text-sm">{r.level}</div>
                          </TableCell>

                          <TableCell className="text-center align-center px-2 py-2">
                            <div className="text-sm">{r.type}</div>
                          </TableCell>

                          <TableCell className="text-center align-center px-2 py-2">
                            <Badge
                              className="whitespace-nowrap border-0"
                              style={{
                                backgroundColor: r.statusBg ?? undefined,
                                color: r.statusFg ?? undefined,
                              }}
                              title={r.statusLabel}
                            >
                              {r.statusLabel}
                            </Badge>
                          </TableCell>

                          {/* acciones */}
                          <TableCell className="text-center sticky right-0 bg-background z-10 border-l px-2 py-1">
                            <div className="inline-flex items-center gap-1 whitespace-nowrap">
                              <Button
                                size="icon"
                                variant="outline"
                                title="Cumplimiento"
                                aria-label="Cumplimiento"
                                onClick={() => openComplianceFor(r.id)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                title="Metas"
                                aria-label="Metas"
                              >
                                <Target className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                title="Notas"
                                aria-label="Notas"
                                onClick={() => openNotes(r.id)}
                              >
                                <StickyNote className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                title="Configuración"
                                aria-label="Configuración"
                                onClick={() =>
                                  openConfigureFromConfigured(r.id)
                                }
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ---------- Acordeón 2: Objetivos sin configurar ---------- */}
          <AccordionItem value="unconfigured" className="border-b">
            <AccordionTrigger className="px-4 py-3 bg-muted/40 hover:no-underline">
              <div className="flex items-center gap-2">
                <span className="font-medium">Objetivos sin configurar</span>
                <Badge variant="secondary">{totalUnconfigured}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {loadingUnconfigured ? (
                <Skeleton className="h-40 w-full" />
              ) : totalUnconfigured === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  No hay objetivos por configurar.
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <Table className="w-full min-w-[1000px]">
                    <SharedColGroup />
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center whitespace-nowrap px-2">
                          #
                        </TableHead>
                        <TableHead className="whitespace-nowrap px-2">
                          Objetivo
                        </TableHead>
                        <TableHead className="whitespace-nowrap text-center px-2">
                          Nivel
                        </TableHead>
                        <TableHead className="whitespace-nowrap text-center px-2">
                          Tipo
                        </TableHead>
                        <TableHead className="text-center whitespace-nowrap px-2">
                          Estado
                        </TableHead>
                        <TableHead className="whitespace-nowrap text-center sticky right-0 bg-background z-20 border-l px-2">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {unconfRows.map((r) => (
                        <TableRow key={r.id} className="align-top">
                          <TableCell className="text-center whitespace-nowrap align-top px-2 py-2">
                            {r.index}
                          </TableCell>

                          {/* objetivo + indicador */}
                          <TableCell className="align-top px-2 py-2">
                            <div className="font-medium leading-5 break-words whitespace-pre-wrap">
                              {r.name}
                            </div>
                            <div className="text-xs text-muted-foreground break-words whitespace-pre-wrap mt-0.5">
                              {r.indicatorName}
                            </div>
                          </TableCell>

                          <TableCell className="text-center align-center px-2 py-2">
                            <div className="text-sm">{r.level}</div>
                          </TableCell>

                          <TableCell className="text-center align-center px-2 py-2">
                            <div className="text-sm">{r.type}</div>
                          </TableCell>

                          <TableCell className="text-center align-center px-2 py-2">
                            <Badge
                              className="whitespace-nowrap border-0"
                              style={{
                                backgroundColor: r.statusBg ?? undefined,
                                color: r.statusFg ?? undefined,
                              }}
                              title={r.statusLabel}
                            >
                              {r.statusLabel}
                            </Badge>
                          </TableCell>

                          {/* acciones (solo configuración) */}
                          <TableCell className="text-center sticky right-0 bg-background z-10 border-l px-2 py-1">
                            <div className="inline-flex items-center gap-1 whitespace-nowrap">
                              <Button
                                size="icon"
                                variant="outline"
                                title="Notas"
                                aria-label="Notas"
                                onClick={() => openNotes(r.id)}
                              >
                                <StickyNote className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                title="Configuración"
                                aria-label="Configuración"
                                onClick={() =>
                                  openConfigureFromUnconfigured(r.id)
                                }
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>

      {/* Modales */}
      <NewObjectiveModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        onCreate={async (payload) => {
          if (!onCreateObjective) return;
          await onCreateObjective(payload);
          setOpenCreate(false);
        }}
      />

      <ObjectiveComplianceModal
        open={openCompliance}
        onOpenChange={setOpenCompliance}
        icoMonthly={selected?.objective?.icoMonthly ?? []}
        objective={selected?.objective}
        onUpdate={onComplianceUpdate}
      />
      {openConfigure && configureData && (
        <ObjectiveConfigureModal
          open={openConfigure}
          onClose={() => setOpenConfigure(false)}
          data={configureData}
          strategicPlanId={strategicPlanId}
          positionId={positionId}
          year={year}
        />
      )}
      <NotesModal
        isOpen={!!notesForObjective}
        onClose={closeNotes}
        referenceId={notesForObjective ?? ""}
      />
    </Card>
  );
}
