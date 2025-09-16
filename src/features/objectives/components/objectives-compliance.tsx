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
import type {
  IcoBoardData,
  IcoBoardListItem,
} from "@/features/objectives/types/ico-board";
import { NewObjectiveModal, NewObjectivePayload } from "./new-objective-modal";
import { CheckCircle, Map, Rocket, Settings, Target } from "lucide-react";
import {
  ObjectiveComplianceChange,
  ObjectiveComplianceModal,
} from "./objective-compliance-modal";
import { useUpdateObjectiveGoal } from "../hooks/use-objective-goals";
import { QKEY } from "@/shared/api/query-keys";

/* --------------------- utils --------------------- */
const LEVEL_LABEL: Record<string, string> = {
  EST: "Estratégico",
  OPE: "Operativo",
};
const TYPE_LABEL: Record<string, string> = { RES: "Resultado", GES: "Gestión" };

function normalizeLevel(v?: string | null) {
  return v ? LEVEL_LABEL[v.toUpperCase()] ?? v : "—";
}
function normalizeType(v?: string | null) {
  return v ? TYPE_LABEL[v.toUpperCase()] ?? v : "—";
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

/* --------------------- componente --------------------- */
export default function ObjectivesCompliance({
  data,
  loading,
  error,
  onCreateObjective, // opcional
  onComplianceUpdate,
}: {
  data?: IcoBoardData;
  loading?: boolean;
  error?: boolean;
  onCreateObjective?: (payload: NewObjectivePayload) => void;
  onComplianceUpdate?: (changes: ObjectiveComplianceChange[]) => void;
}) {
  const rows: IcoBoardListItem[] = data?.listObjectives ?? [];
  const empty = !loading && !error && rows.length === 0;

  const [openCompliance, setOpenCompliance] = useState(false);
  const [selected, setSelected] = useState<IcoBoardListItem | null>(null);

  const openComplianceFor = (objectiveId: string) => {
    const item = rows.find((it) => it.objective?.id === objectiveId) ?? null;
    setSelected(item);
    setOpenCompliance(true);
  };

  const computed: RowItem[] = useMemo(
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

  const [openCreate, setOpenCreate] = useState(false);

  return (
    <div className="w-full">
      {/* header fuera de la tabla */}
      {/* <div className="mb-3 flex items-center justify-end">
        <Button
          size="sm"
          className="h-8 btn-gradient"
          onClick={() => setOpenCreate(true)}
        >
          + Nuevo Objetivo
        </Button>
      </div> */}

      {loading && <Skeleton className="h-48 w-full" />}
      {error && (
        <div className="text-sm text-destructive">
          No se pudo cargar la lista de objetivos.
        </div>
      )}
      {empty && !loading && !error && (
        <div className="text-sm text-muted-foreground">
          No hay objetivos para los filtros seleccionados.
        </div>
      )}

      {!loading && !error && !empty && (
        <div className="w-full overflow-x-auto">
          <Table className="w-full min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 whitespace-nowrap">#</TableHead>
                <TableHead className="whitespace-nowrap">Objetivo</TableHead>
                <TableHead className="whitespace-nowrap text-center">
                  Nivel
                </TableHead>
                <TableHead className="whitespace-nowrap text-center">
                  Tipo
                </TableHead>
                <TableHead className="text-center whitespace-nowrap">
                  Estado
                </TableHead>
                <TableHead className="text-center whitespace-nowrap sticky right-0 bg-background z-20 border-l px-3">
                  Configuración
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {computed.map((r) => (
                <TableRow key={r.id} className="align-top">
                  <TableCell className="w-12 whitespace-nowrap align-top">
                    {r.index}
                  </TableCell>

                  {/* objetivo + indicador con saltos de línea */}
                  <TableCell className="align-top">
                    <div className="font-medium leading-5 break-words whitespace-pre-wrap">
                      {r.name}
                    </div>
                    <div className="text-xs text-muted-foreground break-words whitespace-pre-wrap mt-0.5">
                      {r.indicatorName}
                    </div>
                  </TableCell>

                  <TableCell className=" text-center align-center">
                    <div className="text-sm">{r.level}</div>
                  </TableCell>
                  <TableCell className="text-center align-center">
                    <div className="text-sm">{r.type}</div>
                  </TableCell>

                  <TableCell className="text-center align-center">
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

                  {/* columna fija de acciones */}
                  <TableCell className="text-center space-x-2 align-top sticky right-0 bg-background z-10 border-l">
                    <Button
                      size="sm"
                      variant="outline"
                      title="Cumplimiento"
                      onClick={() => openComplianceFor(r.id)}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    {/* <Button size="sm" variant="outline" title="Metas">
                      <Target className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" title="Mapa">
                      <Map className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" title="Despliegue">
                      <Rocket className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" title="Configuración">
                      <Settings className="w-4 h-4" />
                    </Button> */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* modal separada */}
      <NewObjectiveModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        onCreate={onCreateObjective}
      />

      <ObjectiveComplianceModal
        open={openCompliance}
        onOpenChange={setOpenCompliance}
        icoMonthly={selected?.objective?.icoMonthly ?? []}
        objective={selected?.objective}
        onUpdate={onComplianceUpdate}
      />
    </div>
  );
}
