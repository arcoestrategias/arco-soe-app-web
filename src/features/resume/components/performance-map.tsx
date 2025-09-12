// features/resume/components/performance-map.tsx
"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { PositionOverviewItem } from "../types/positions-overview";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import clsx from "clsx";

type Thresholds = {
  criticalMax?: number; // p.ej. 75
  acceptableMin?: number; // p.ej. 75
  acceptableMax?: number; // p.ej. 98.99
  excellentMin?: number; // p.ej. 99
};

type Labels = {
  critical?: string; // p.ej. "Crítico"
  acceptable?: string; // p.ej. "Aceptable"
  excellent?: string; // p.ej. "Excelente"
};

type PerformanceMapProps = {
  positions: PositionOverviewItem[];
  hoveredId?: string | null;
  onHoverIdChange?: (id: string | null) => void;

  /** Umbrales para clasificar por ICP (eje X) */
  thresholds?: Thresholds;

  /** Textos para la leyenda/tooltip */
  labels?: Labels;
};

type Point = {
  id: string;
  x: number; // ICP
  y: number; // ICO
  z: number;
  name: string;
  user: string;
  performance?: number;
};

function toChartData(positions: PositionOverviewItem[]): Point[] {
  return positions.map((p) => ({
    id: p.idPosition,
    x: Number(p.icp ?? 0),
    y: Number(p.ico ?? 0),
    z: 40,
    name: p.namePosition,
    user: p.nameUser ?? "", // <- coacción a string para evitar el error
    performance: typeof p.performance === "number" ? p.performance : undefined,
  }));
}

export default function PerformanceMap({
  positions,
  hoveredId,
  onHoverIdChange,
  thresholds,
  labels,
}: PerformanceMapProps) {
  // defaults como en tu velocímetro
  const th = React.useMemo(
    () => ({
      criticalMax: thresholds?.criticalMax ?? 75,
      acceptableMin: thresholds?.acceptableMin ?? 75,
      acceptableMax: thresholds?.acceptableMax ?? 98.99,
      excellentMin: thresholds?.excellentMin ?? 99,
    }),
    [thresholds]
  );

  const lb = React.useMemo(
    () => ({
      critical: labels?.critical ?? "Crítico",
      acceptable: labels?.acceptable ?? "Aceptable",
      excellent: labels?.excellent ?? "Excelente",
    }),
    [labels]
  );

  const points = React.useMemo(() => toChartData(positions), [positions]);

  // Clasificación por ICP (eje X) usando thresholds
  function getStatusByICP(icp: number) {
    if (icp >= th.excellentMin)
      return { key: "excellent", fill: "#10B981", text: lb.excellent };
    if (icp >= th.acceptableMin && icp <= th.acceptableMax)
      return { key: "acceptable", fill: "#F59E0B", text: lb.acceptable };
    return { key: "critical", fill: "#EF4444", text: lb.critical };
  }

  const criticos = points.filter((p) => getStatusByICP(p.x).key === "critical");
  const aceptables = points.filter(
    (p) => getStatusByICP(p.x).key === "acceptable"
  );
  const excelentes = points.filter(
    (p) => getStatusByICP(p.x).key === "excellent"
  );

  const ticks10 = [50, 60, 70, 80, 90, 100]; // paso de 10 para ICP e ICO

  const renderShape = (baseFill: string) => (props: any) => {
    const { cx, cy, payload } = props;
    const isHovered = hoveredId && payload?.id === hoveredId;
    const r = isHovered ? 7 : 5.5;
    return (
      <g>
        <circle cx={cx} cy={cy} r={r + 1.5} fill="#ffffff" />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={baseFill}
          stroke={isHovered ? "#2563EB" : "transparent"}
          strokeWidth={isHovered ? 2 : 0}
        />
      </g>
    );
  };

  function CustomTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload as Point;
    const status = getStatusByICP(p.x);

    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-md px-4 py-3">
        <div className="font-semibold text-gray-900">{p.name}</div>
        <div className="text-xs text-gray-600 mb-1">{p.user}</div>
        <div className="text-sm text-gray-800">ICO: {p.y}%</div>
        <div className="text-sm text-gray-800">ICP: {p.x}%</div>
        {typeof p.performance === "number" && (
          <div className="text-sm text-gray-800">
            Performance: {p.performance}%
          </div>
        )}
        <div
          className={clsx(
            "mt-1 text-sm font-medium",
            status.key === "excellent"
              ? "text-green-600"
              : status.key === "acceptable"
              ? "text-amber-600"
              : "text-red-600"
          )}
        >
          Estado: {status.text}
        </div>
      </div>
    );
  }

  // Leyenda dinámica con rangos basados en thresholds
  const legendCritical = `${lb.critical} (<${th.criticalMax}%)`;
  const legendAcceptable = `${lb.acceptable} (${th.acceptableMin}–${th.acceptableMax}%)`;
  const legendExcellent = `${lb.excellent} (≥${th.excellentMin}%)`;

  return (
    <Card>
      <div className="p-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-gray-900">
            Mapa de Performance por Posición
          </CardTitle>
          <p className="text-xs text-gray-600">
            Distribución de posiciones según su ICO (eje Y) e ICP (eje X)
          </p>
        </CardHeader>

        <div className="h-[360px] w-full">
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 10, right: 16, left: 0, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="ICP"
                unit="%"
                domain={[50, 100]}
                ticks={ticks10} // 👈 paso de 10
                tick={{ fontSize: 12, fill: "#374151" }}
                label={{
                  value: "ICP (%)",
                  position: "insideBottomRight",
                  offset: -16,
                  style: { fill: "#374151" },
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="ICO"
                unit="%"
                domain={[50, 100]}
                ticks={ticks10}
                tick={{ fontSize: 12, fill: "#374151" }}
                label={{
                  value: "ICO (%)",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  style: { fill: "#374151" },
                }}
              />
              <ZAxis type="number" dataKey="z" range={[60, 100]} />

              {/* Línea de referencia opcional (p.ej., umbral aceptable mínimo) */}
              <ReferenceLine
                x={th.acceptableMin}
                stroke="#9CA3AF"
                strokeDasharray="4 4"
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Capas por estado (clasificación por ICP) */}
              <Scatter
                data={criticos}
                shape={renderShape("#EF4444")}
                onMouseEnter={(e: any) => onHoverIdChange?.(e?.id ?? null)}
                onMouseLeave={() => onHoverIdChange?.(null)}
              />
              <Scatter
                data={aceptables}
                shape={renderShape("#F59E0B")}
                onMouseEnter={(e: any) => onHoverIdChange?.(e?.id ?? null)}
                onMouseLeave={() => onHoverIdChange?.(null)}
              />
              <Scatter
                data={excelentes}
                shape={renderShape("#10B981")}
                onMouseEnter={(e: any) => onHoverIdChange?.(e?.id ?? null)}
                onMouseLeave={() => onHoverIdChange?.(null)}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Leyenda */}
        <div className="mt-3 flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-gray-700">{legendCritical}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-gray-700">{legendAcceptable}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-gray-700">{legendExcellent}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
