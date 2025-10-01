// features/priorities/components/priorities-dashboard.tsx
"use client";

import { useMemo, useState } from "react";
import { QueryKey, useQuery } from "@tanstack/react-query";
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

import { getBusinessUnitId } from "@/shared/auth/storage";
import { getPositionsByBusinessUnit } from "@/features/positions/services/positionsService";
import { Plus } from "lucide-react";

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

  // NUEVO: traer posiciones de la BU para “objetivos de terceros”
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

  // Fila de creación
  const [showCreateRow, setShowCreateRow] = useState(false);

  // Contadores de estados (para el card)
  const statusCounters = useMemo(() => {
    const base = { OPE: 0, CLO: 0, CAN: 0 };
    for (const it of items)
      if (it.status in base) base[it.status as "OPE" | "CLO" | "CAN"]++;
    return base;
  }, [items]);

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
          <Button
            onClick={() => setShowCreateRow((v) => !v)}
            size="sm"
            className="h-8 btn-gradient"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Prioridad
          </Button>
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
