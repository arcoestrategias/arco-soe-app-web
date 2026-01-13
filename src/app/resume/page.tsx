// /app/resumen/page.tsx
"use client";

import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { SidebarLayout } from "@/shared/layout";
import { getBusinessUnitId, getPositionId } from "@/shared/auth/storage"; // ✅ añade getPositionId
import { StrategicPlanSelect } from "@/shared/filters/components/StrategicPlanSelect";
import { PositionSelect } from "@/shared/filters/components/PositionSelect";
import { MonthSelect } from "@/shared/filters/components/MonthSelect";
import { YearSelect } from "@/shared/filters/components/YearSelect";
import { FilterField } from "@/shared/components/FilterField";
import { Card, CardContent } from "@/components/ui/card";
import { usePositionsOverview } from "@/features/resume/hooks/use-positions-overview";
import PerformanceMap from "@/features/resume/components/performance-map";
import RoleSummaryTable from "@/features/resume/components/role-summary-table";
import PositionsAssignmentsChart from "@/features/resume/components/positions-assignments-chart";
import Velocimeter from "@/features/resume/components/velocimeter";
import PositionAnnualTrendCard from "@/features/resume/components/position-annual-trend-card";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";
import { usePermission } from "@/shared/auth/access-control";

export default function ResumenPage() {
  const businessUnitId = getBusinessUnitId() ?? undefined;

  const showFilterStrategicPlan = usePermission(
    PERMISSIONS.PERFORMANCE.SHOW_FILTER_STRATEGIC_PLAN
  );
  const showFilterPosition = usePermission(
    PERMISSIONS.PERFORMANCE.SHOW_FILTER_POSITION
  );
  const showFilterMonth = usePermission(
    PERMISSIONS.PERFORMANCE.SHOW_FILTER_MONTH
  );
  const showFilterYear = usePermission(
    PERMISSIONS.PERFORMANCE.SHOW_FILTER_YEAR
  );
  const showICOChart = usePermission(PERMISSIONS.PERFORMANCE.SHOW_ICO_CHART);
  const showICPChart = usePermission(PERMISSIONS.PERFORMANCE.SHOW_ICP_CHART);
  const showPerformanceChart = usePermission(
    PERMISSIONS.PERFORMANCE.SHOW_PERFORMANCE_CHART
  );
  const showAssignmentsChart = usePermission(
    PERMISSIONS.PERFORMANCE.SHOW_ASSIGNMENTS_CHART
  );
  const showAnnualPerformanceTrendChart = usePermission(
    PERMISSIONS.PERFORMANCE.SHOW_ANNUAL_PERFORMANCE_TREND_CHART
  );
  const showPerformanceMapChart = usePermission(
    PERMISSIONS.PERFORMANCE.SHOW_PERFORMANCE_MAP_CHART
  );
  const showPositionSummaryTable = usePermission(
    PERMISSIONS.PERFORMANCE.SHOW_POSITION_SUMMARY_TABLE
  );

  // Filtros
  const [strategicPlanId, setStrategicPlanId] = useState<string | null>(null);
  const [positionId, setPositionId] = useState<string | null>(
    getPositionId() ?? null
  );

  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    if (!showFilterPosition) {
      setPositionId(getPositionId() ?? null);
    }
  }, [showFilterPosition]);

  // Fetch principal: /positions/overview (acepta positionId)
  const { data, isLoading, error } = usePositionsOverview(
    businessUnitId,
    strategicPlanId ?? undefined,
    year,
    month,
    positionId ?? null
  );

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // ¿hay posición seleccionada?
  const selected = useMemo(
    () => data?.listPositions?.find((p) => p.idPosition === positionId) ?? null,
    [data, positionId]
  );

  // KPIs
  const kpis = useMemo(() => {
    if (selected) {
      return {
        ico: typeof selected.ico === "number" ? selected.ico : 0,
        icp: typeof selected.icp === "number" ? selected.icp : 0,
        performance:
          typeof selected.performance === "number" ? selected.performance : 0,
      };
    }
    const rows = data?.listPositions ?? [];
    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const icoVals = rows
      .map((r) => r.ico)
      .filter((v): v is number => typeof v === "number");
    const icpVals = rows
      .map((r) => r.icp)
      .filter((v): v is number => typeof v === "number");
    const perfVals = rows
      .map((r) => r.performance)
      .filter((v): v is number => typeof v === "number");

    return {
      ico: avg(icoVals),
      icp: avg(icpVals),
      performance: avg(perfVals),
    };
  }, [data, selected]);

  return (
    <SidebarLayout currentPath="/resume" onNavigate={() => {}}>
      <div className="space-y-6 font-system">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 heading-optimized">
              Performance
            </h1>
          </div>

          <div className="flex gap-3">
            {showFilterStrategicPlan && (
              <div className="w-full">
                <FilterField label="Plan estratégico">
                  <StrategicPlanSelect
                    businessUnitId={businessUnitId}
                    value={strategicPlanId}
                    onChange={setStrategicPlanId}
                    persist
                    clearOnUnmount
                  />
                </FilterField>
              </div>
            )}

            {showFilterPosition ? (
              <div className="w-full">
                <FilterField label="Posición">
                  <PositionSelect
                    businessUnitId={businessUnitId}
                    value={positionId}
                    onChange={setPositionId}
                    defaultFromAuth
                    showOptionAll
                    persist
                    clearOnUnmount
                  />
                </FilterField>
              </div>
            ) : null}

            {showFilterMonth && (
              <div className="w-full">
                <FilterField label="Mes">
                  <MonthSelect value={month} onChange={setMonth} />
                </FilterField>
              </div>
            )}

            {showFilterYear && (
              <div className="w-full">
                <FilterField label="Año">
                  <YearSelect value={year} onChange={setYear} />
                </FilterField>
              </div>
            )}
          </div>
        </div>

        {isLoading && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Cargando resumen de posiciones…
            </CardContent>
          </Card>
        )}
        {error && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-red-600">
              Ocurrió un error al cargar el resumen de posiciones.
            </CardContent>
          </Card>
        )}

        {/* === Fila 1: Velocímetros (siempre) === */}
        {data?.listPositions && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {showICOChart && (
              <Velocimeter
                value={kpis.ico ?? 0}
                title={
                  selected ? "ICO (mes) de la posición" : "ICO (mes) promedio"
                }
                metricLabel="ICO"
                thresholds={{
                  criticalMax: 75,
                  acceptableMin: 75,
                  acceptableMax: 98.99,
                  excellentMin: 99,
                }}
                labels={{
                  critical: "Crítico",
                  acceptable: "Aceptable",
                  excellent: "Excelente",
                }}
              />
            )}
            {showICPChart && (
              <Velocimeter
                value={kpis.icp ?? 0}
                title={
                  selected ? "ICP (mes) de la posición" : "ICP (mes) promedio"
                }
                metricLabel="ICP"
                thresholds={{
                  criticalMax: 75,
                  acceptableMin: 75,
                  acceptableMax: 98.99,
                  excellentMin: 99,
                }}
                labels={{
                  critical: "Crítico",
                  acceptable: "Aceptable",
                  excellent: "Excelente",
                }}
              />
            )}
            {showPerformanceChart && (
              <Velocimeter
                value={kpis.performance ?? 0}
                title={
                  selected
                    ? "Performance (mes) de la posición"
                    : "Performance (mes) promedio"
                }
                metricLabel="Performance"
                thresholds={{
                  criticalMax: 75,
                  acceptableMin: 75,
                  acceptableMax: 98.99,
                  excellentMin: 99,
                }}
                labels={{
                  critical: "Crítico",
                  acceptable: "Aceptable",
                  excellent: "Excelente",
                }}
              />
            )}
          </div>
        )}

        {/* === Fila 2: Vista por posición o vista general === */}
        {data?.listPositions && (
          <>
            {selected ? (
              // --- Vista por posición seleccionada ---
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {showAnnualPerformanceTrendChart && (
                  <div className="md:col-span-2">
                    <PositionAnnualTrendCard
                      className="h-full"
                      trend={selected.annualTrend}
                    />
                  </div>
                )}
                {showPerformanceMapChart && (
                  <div className="md:col-span-1 min-h-[360px]">
                    <PerformanceMap
                      positions={[selected]}
                      hoveredId={hoveredId}
                      onHoverIdChange={setHoveredId}
                      thresholds={{
                        criticalMax: 75,
                        acceptableMin: 75,
                        acceptableMax: 98.99,
                        excellentMin: 99,
                      }}
                      labels={{
                        critical: "Crítico",
                        acceptable: "Aceptable",
                        excellent: "Excelente",
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              // --- Vista general (sin posición seleccionada) ---
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {showAssignmentsChart && (
                    <div className="md:col-span-2 min-h-[360px]">
                      <PositionsAssignmentsChart
                        className="h-full"
                        positions={data.listPositions}
                      />
                    </div>
                  )}
                  {showPerformanceMapChart && (
                    <div className="md:col-span-1 min-h-[360px]">
                      <PerformanceMap
                        positions={data.listPositions}
                        hoveredId={hoveredId}
                        onHoverIdChange={setHoveredId}
                        thresholds={{
                          criticalMax: 75,
                          acceptableMin: 75,
                          acceptableMax: 98.99,
                          excellentMin: 99,
                        }}
                        labels={{
                          critical: "Crítico",
                          acceptable: "Aceptable",
                          excellent: "Excelente",
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Tabla a ancho completo */}
                {showPositionSummaryTable && (
                  <RoleSummaryTable
                    positions={data.listPositions}
                    hoveredId={hoveredId}
                    onHoverIdChange={setHoveredId}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </SidebarLayout>
  );
}
