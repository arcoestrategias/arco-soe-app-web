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
  ReferenceArea,
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

type GroupedPoint = {
  x: number;
  y: number;
  z: number;
  items: Point[];
};

function groupPositions(positions: PositionOverviewItem[]): GroupedPoint[] {
  const groups = new Map<string, GroupedPoint>();

  positions.forEach((p) => {
    const x = Number(p.icp ?? 0);
    const y = Number(p.ico ?? 0);
    const key = `${x}-${y}`;

    if (!groups.has(key)) {
      groups.set(key, { x, y, z: 40, items: [] });
    }
    groups.get(key)!.items.push({
      id: p.idPosition,
      x,
      y,
      z: 40,
      name: p.namePosition,
      user: p.nameUser ?? "",
      performance:
        typeof p.performance === "number" ? p.performance : undefined,
    });
  });

  return Array.from(groups.values());
}

// Función para obtener colores vivos tipo semáforo/calor
function getVividColor(value: number) {
  // Clampear entre 0 y 100
  const v = Math.max(0, Math.min(100, value));
  // HSL: 0=Rojo, 60=Amarillo, 120=Verde. Usamos 90% saturación y 45% luz para que sea "vivo".
  const hue = (v / 100) * 120;
  return `hsl(${hue}, 90%, 45%)`;
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

  // Estado para forzar el re-render del gráfico y cerrar el tooltip al salir del componente
  const [chartKey, setChartKey] = React.useState(0);

  const groupedPoints = React.useMemo(
    () => groupPositions(positions),
    [positions]
  );

  const ticks10 = [0, 20, 40, 60, 80, 100];

  const maxIco = React.useMemo(() => {
    const rawMax = Math.max(
      100,
      ...positions.map((d) => d.ico ?? 0),
    );
    return Math.ceil(rawMax / 20) * 20;
  }, [positions]);

  const icoTicks = React.useMemo(() => {
    const ticks: number[] = [];
    for (let i = 0; i <= maxIco; i += 20) ticks.push(i);
    return ticks;
  }, [maxIco]);

  const renderVividShape = (props: any) => {
    const { cx, cy, payload } = props;
    // Resaltar si el ID hovereado está dentro de este grupo
    const isHovered =
      hoveredId && payload?.items?.some((i: Point) => i.id === hoveredId);
    const r = isHovered ? 8 : 6;
    const fill = getVividColor(
      payload.items?.[0]?.performance ?? payload.x,
    );

    return (
      <g>
        {/* Borde blanco para resaltar sobre el fondo de color */}
        <circle cx={cx} cy={cy} r={r + 2} fill="#ffffff" />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={fill}
          stroke={isHovered ? "#000" : "none"}
          strokeWidth={isHovered ? 2 : 0}
          style={{ transition: "all 0.3s ease" }}
        />
      </g>
    );
  };

  function CustomTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const group = payload[0].payload as GroupedPoint;
    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-md px-4 py-3 max-h-[320px] overflow-y-auto max-w-[300px]">
        {group.items.length > 1 && (
          <div className="mb-2 pb-2 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
            {group.items.length} Posiciones en este punto
          </div>
        )}
        {group.items.map((p, idx) => (
          <div
            key={p.id}
            className={clsx(idx > 0 && "mt-3 pt-3 border-t border-gray-100")}
          >
            <div className="font-semibold text-gray-900 leading-tight">
              {p.name}
            </div>
            <div className="text-xs text-gray-600 mb-1">{p.user}</div>
            <div className="flex gap-3 text-sm text-gray-800">
              <span>ICO: {p.y}%</span>
              <span>ICP: {p.x}%</span>
            </div>
            {typeof p.performance === "number" && (
              <div className="text-sm text-gray-800">
                Performance: {p.performance}%
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card
      onMouseLeave={() => {
        setChartKey((prev) => prev + 1);
        onHoverIdChange?.(null);
      }}
    >
      <div className="p-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-gray-900">
            Mapa de Performance por Posición
          </CardTitle>
        </CardHeader>

        <div className="h-[360px] w-full">
          <ResponsiveContainer>
            <ScatterChart
              key={chartKey}
              margin={{ top: 10, right: 16, left: 0, bottom: 24 }}
            >
              <defs>
                <linearGradient
                  id="heatmapGradient"
                  x1="0"
                  y1="1"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0%" stopColor="rgba(255, 0, 0, 0.6)" />
                  <stop offset="50%" stopColor="rgba(255, 255, 0, 0.6)" />
                  <stop offset="100%" stopColor="rgba(0, 255, 0, 0.6)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="ICP"
                unit="%"
                domain={[0, 100]}
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
                domain={[0, maxIco]}
                ticks={icoTicks}
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

              {/* Fondo con gradiente para simular mapa de calor */}
              <ReferenceArea
                x1={0}
                x2={100}
                y1={0}
                y2={maxIco}
                fill="url(#heatmapGradient)"
                stroke="none"
              />

              <Tooltip
                content={<CustomTooltip />}
                trigger="click"
                wrapperStyle={{ pointerEvents: "auto" }}
              />

              {/* Puntos con color dinámico */}
              <Scatter
                data={groupedPoints}
                shape={renderVividShape}
                onMouseEnter={(e: any) => {
                  // Si hay un solo item, notificamos su ID para resaltar en tabla.
                  // Si hay varios, podríamos no resaltar nada o resaltar el primero.
                  onHoverIdChange?.(
                    e?.items?.length === 1 ? e.items[0].id : null
                  );
                }}
                onMouseLeave={() => onHoverIdChange?.(null)}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
