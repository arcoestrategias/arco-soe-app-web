// features/priorities/components/priorities-dashboard.tsx
"use client";

import { useMemo, useState } from "react";
import { QueryKey, useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  usePriorities,
  useToggleActivePriority,
} from "@/features/priorities/hooks/use-priorities";
import PriorityStatesAndIcpCard from "./PriorityStatesAndIcpCard";
import AnnualTrendCard from "./AnnualTrendCard";
import PrioritiesTable from "./PrioritiesTable";
import { toast } from "sonner";
import { getHumanErrorMessage } from "@/shared/api/response";
import { QKEY } from "@/shared/api/query-keys";

import { getBusinessUnitId, getCompanyId } from "@/shared/auth/storage";
import { getPositionsByBusinessUnit } from "@/features/positions/services/positionsService";
import { getStrategicPlan } from "@/features/strategic-plans/services/strategicPlansService";
import { Plus, FileDown } from "lucide-react";

import {
  exportPrioritiesPDF,
  // Si tienes el tipo y quieres mantener TS estricto, actualízalo para incluir monthlyClassStyle
  // type PrioritiesReportPayload,
} from "@/features/reports/services/reportsService";

export default function PrioritiesDashboard({
  planId,
  positionId,
  month,
  year,
  onDirtyChange,
  resetSignal,
}: {
  planId?: string;
  positionId?: string;
  month: number;
  year: number;
  onDirtyChange?: (dirty: boolean) => void;
  resetSignal?: number;
}) {
  const enabled = !!positionId && !!month && !!year;

  // Lista principal
  const page = 1;
  const limit = 1000;
  const { data, isLoading, isError } = usePriorities(
    { positionId, month, year, page, limit },
    enabled
  );

  const items = data?.items ?? [];
  const icp = data?.icp;

  // Inactivar
  const listKey = positionId
    ? QKEY.prioritiesByPMY(positionId, month, year, page, limit)
    : undefined;

  const toggleActiveMut = useToggleActivePriority(listKey);
  const handleInactivate = (id: string) => {
    toggleActiveMut.mutate(
      { id, payload: { isActive: false } },
      {
        onSuccess: () => toast.success("Prioridad inactivada"),
        onError: (e) => toast.error(getHumanErrorMessage(e)),
      }
    );
  };

  const seriesFrom = `${year}-01`;
  const seriesTo = `${year}-12`;
  const seriesKey = positionId
    ? QKEY.prioritiesIcpSeries(positionId, seriesFrom, seriesTo)
    : undefined;

  const invalidateKeys = useMemo<QueryKey[]>(() => {
    const ks: QueryKey[] = [];
    if (listKey) ks.push(listKey);
    if (seriesKey) ks.push(seriesKey);
    return ks;
  }, [listKey, seriesKey]);

  // Posiciones de la BU (para objetivos de terceros)
  const buId = getBusinessUnitId();
  const { data: positions = [] } = useQuery({
    queryKey: buId ? QKEY.positionsByBU(buId) : ["positions", "disabled"],
    queryFn: () => getPositionsByBusinessUnit(buId!),
    enabled: !!buId,
    staleTime: 60_000,
  });

  const otherPositions = useMemo(
    () =>
      (positions as Array<{ id: string; name: string }>)
        .filter((p) => p.id !== positionId)
        .map((p) => ({ id: p.id, name: p.name })),
    [positions, positionId]
  );

  // Traer plan (para el payload del reporte)
  const { data: plan } = useQuery({
    queryKey: planId
      ? QKEY.strategicPlan(planId)
      : ["strategic-plan", "disabled"],
    queryFn: () => getStrategicPlan(planId!),
    enabled: !!planId,
    staleTime: 60_000,
  });

  // Fila de creación
  const [showCreateRow, setShowCreateRow] = useState(false);

  // Contadores de estados (para el card)
  const statusCounters = useMemo(() => {
    const base = { OPE: 0, CLO: 0, CAN: 0 };
    for (const it of items)
      if (it.status in base) base[it.status as "OPE" | "CLO" | "CAN"]++;
    return base;
  }, [items]);

  // ---- Mapping de monthlyClass a etiqueta (mismo que la tabla)
  const MONTHLY_CLASS_LABEL: Record<string, string> = {
    ABIERTAS: "En proceso",
    EN_PROCESO: "En proceso",
    ANULADAS: "Anulada",
    CUMPLIDAS_A_TIEMPO: "Cumplida a tiempo",
    CUMPLIDAS_ATRASADAS_DEL_MES: "Cumplida tarde",
    CUMPLIDAS_ATRASADAS_MESES_ANTERIORES: "Cumplida tarde",
    CUMPLIDAS_DE_OTRO_MES: "Cumplida otro mes",
    NO_CUMPLIDAS_ATRASADAS_DEL_MES: "Atrasada",
    NO_CUMPLIDAS_ATRASADAS_MESES_ANTERIORES: "Muy atrasada",
    NO_CUMPLIDAS_ATRASADAS: "Atrasada",
    NO_CUMPLIDAS_MESES_ATRAS: "Muy atrasada",
  };
  function resolveMonthlyLabel(mc?: string): string | undefined {
    if (!mc) return;
    if (MONTHLY_CLASS_LABEL[mc]) return MONTHLY_CLASS_LABEL[mc];
    const M = mc.toUpperCase();
    if (M.includes("CUMPLIDAS") && M.includes("ATRASADAS"))
      return "Cumplida tarde";
    if (M.startsWith("NO_CUMPLIDAS")) {
      if (
        M.includes("MESES") ||
        M.includes("ANTERIORES") ||
        M.includes("ATRAS")
      )
        return "Muy atrasada";
      if (M.includes("DEL_MES") || M.includes("MES")) return "Atrasada";
      return "Atrasada";
    }
    return undefined;
  }

  // ---- Estilos (colores) exactamente como en la UI de la tabla
  const MONTHLY_LABEL_STYLE: Record<string, { bg: string; color: string }> = {
    "En proceso": { bg: "#fde047", color: "#b09c31" },
    Atrasada: { bg: "#fca5a5", color: "#dc2626" },
    "Muy atrasada": { bg: "#dc2626", color: "#ffffff" },
    "Cumplida a tiempo": { bg: "#86efac", color: "#16a34a" },
    "Cumplida tarde": { bg: "#16a34a", color: "#ffffff" },
    Anulada: { bg: "#d1d5db", color: "#000000" },
    "Cumplida otro mes": { bg: "#116b31", color: "#ffffff" },
  };
  function resolveMonthlyStyle(
    mc?: string
  ): { backgroundColor: string; color: string } | undefined {
    const label = resolveMonthlyLabel(mc);
    if (!label) return;
    const s = MONTHLY_LABEL_STYLE[label];
    if (!s) return;
    return { backgroundColor: s.bg, color: s.color };
  }

  // ---- Exportación (PDF)
  const exportMut = useMutation({
    mutationFn: (payload: any /* PrioritiesReportPayload con style */) =>
      exportPrioritiesPDF(payload),
  });

  const buildPayload = (): any => {
    const companyId = getCompanyId() ?? undefined;
    const businessUnitId = getBusinessUnitId() ?? undefined;

    if (!positionId) throw new Error("Falta positionId.");
    if (!plan) throw new Error("No se pudo cargar el plan estratégico.");

    return {
      companyId,
      businessUnitId,
      positionId,
      strategicPlan: {
        id: plan.id,
        name: plan.name ?? "Plan estratégico",
        periodStart: (plan.fromAt ?? "").slice(0, 10),
        periodEnd: (plan.untilAt ?? "").slice(0, 10),
        mission: plan.mission ?? "",
        vision: plan.vision ?? "",
        competitiveAdvantage: plan.competitiveAdvantage ?? "",
      },
      icp: {
        month,
        year,
        positionId,
        totalPlanned: icp?.totalPlanned ?? 0,
        totalCompleted: icp?.totalCompleted ?? 0,
        icp: typeof icp?.icp === "number" ? icp.icp : null,
        notCompletedPreviousMonths: icp?.notCompletedPreviousMonths ?? 0,
        notCompletedOverdue: icp?.notCompletedOverdue ?? 0,
        inProgress: icp?.inProgress ?? 0,
        completedPreviousMonths: icp?.completedPreviousMonths ?? 0,
        completedLate: icp?.completedLate ?? 0,
        completedInOtherMonth: icp?.completedInOtherMonth ?? 0,
        completedOnTime: icp?.completedOnTime ?? 0,
        canceled: icp?.canceled ?? 0,
        completedEarly: icp?.completedEarly ?? 0,
      },
      // Si tu backend espera la clave con typo "prioties", ajusta aquí:
      priorities: items.map((p, idx) => {
        const style = resolveMonthlyStyle(p.monthlyClass);
        return {
          id: p.id,
          isActive: p.isActive,
          name: p.name,
          description: p.description ?? null,
          order: idx + 1, // mismo orden que la tabla
          fromAt: p.fromAt ?? null,
          untilAt: p.untilAt ?? null,
          finishedAt: p.finishedAt ?? null,
          canceledAt: p.canceledAt ?? null,
          month,
          year,
          status: p.status,
          positionId: p.positionId ?? positionId,
          objectiveId: p.objectiveId ?? null,
          objectiveName: p.objectiveName ?? null,
          createdBy: p.createdBy ?? null,
          updatedBy: p.updatedBy ?? null,
          createdAt: p.createdAt ?? null,
          updatedAt: p.updatedAt ?? null,
          // Etiqueta tal como se ve en pantalla
          monthlyClass: resolveMonthlyLabel(p.monthlyClass) ?? null,
          // Colores exactos de la etiqueta UI
          monthlyClassStyle: style
            ? { backgroundColor: style.backgroundColor, color: style.color }
            : null,
          compliance: (p as any).compliance ?? null,
        };
      }),
    };
  };

  const handleExport = async () => {
    try {
      if (!enabled) {
        toast.error("Selecciona posición, mes y año.");
        return;
      }
      if (!planId) {
        toast.error("Selecciona un plan estratégico.");
        return;
      }

      const payload = buildPayload();
      const buffer = await exportMut.mutateAsync(payload);

      const blob = new Blob([buffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prioridades-${year}-${String(month).padStart(2, "0")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Reporte generado");
    } catch (e) {
      toast.error(getHumanErrorMessage(e as any));
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PriorityStatesAndIcpCard
          loading={isLoading && enabled}
          statusCounters={statusCounters}
          icpValue={typeof icp?.icp === "number" ? icp.icp : undefined}
          totalPlanned={icp?.totalPlanned}
          totalCompleted={icp?.totalCompleted}
          breakdown={icp}
        />
        <AnnualTrendCard positionId={positionId} year={year} />
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Cumplimiento de Prioridades
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* Generar Reporte (izquierda) */}
            <Button
              onClick={handleExport}
              size="sm"
              className="h-8 btn-gradient"
              disabled={exportMut.isPending || !enabled || !planId}
              title={!planId ? "Selecciona un plan" : "Generar Reporte"}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Generar Reporte
            </Button>

            {/* Nueva Prioridad (existente) */}
            <Button
              onClick={() => setShowCreateRow((v) => !v)}
              size="sm"
              className="h-8 btn-gradient"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Prioridad
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <PrioritiesTable
            loading={isLoading && enabled}
            error={isError}
            items={items}
            planId={planId}
            positionId={positionId}
            year={year}
            otherPositions={otherPositions}
            onInactivate={handleInactivate}
            inactivatingId={toggleActiveMut.variables?.id}
            invalidateKeys={invalidateKeys}
            showCreateRow={showCreateRow}
            onCloseCreateRow={() => setShowCreateRow(false)}
            onDirtyChange={onDirtyChange}
            resetSignal={resetSignal}
          />
        </CardContent>
      </Card>
    </div>
  );
}
