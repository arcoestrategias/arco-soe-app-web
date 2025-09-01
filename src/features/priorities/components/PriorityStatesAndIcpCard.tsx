"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Rectangle,
} from "recharts";

const COLORS = {
  enProceso: "#fde047", // amarillo
  atrasadas: "#fca5a5", // rojo claro
  muyAtrasadas: "#dc2626", // rojo fuerte
  cumplidas: "#86efac", // verde claro
  cumplidasTarde: "#16a34a", // verde fuerte
  anuladas: "#d1d5db", // gris
};

type IcpBreakdown = {
  inProgress?: number;
  notCompletedOverdue?: number;
  notCompletedPreviousMonths?: number;

  completedOnTime?: number;
  completedLate?: number;
  completedPreviousMonths?: number; // ← NUEVO

  canceled?: number;

  totalPlanned?: number;
  totalCompleted?: number;
  icp?: number;
};

// === mini-hook para animar números 0 → value (easing suave) ===
function useAnimatedNumber(value: number, duration = 900) {
  const [anim, setAnim] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start: number | null = null;
    const from = 0;
    const to = Number.isFinite(value) ? value : 0;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const eased = easeOutCubic(p);
      setAnim(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    setAnim(from);
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return anim;
}

export default function PriorityStatesAndIcpCard({
  loading,
  statusCounters, // compat
  icpValue,
  totalPlanned,
  totalCompleted,
  breakdown,
}: {
  loading?: boolean;
  statusCounters: { OPE: number; CLO: number; CAN: number };
  icpValue?: number;
  totalPlanned?: number;
  totalCompleted?: number;
  breakdown?: IcpBreakdown;
}) {
  const b = breakdown ?? {};

  const counts = useMemo(
    () => ({
      enProceso: b.inProgress ?? 0,
      atrasadas: b.notCompletedOverdue ?? 0,
      muyAtrasadas: b.notCompletedPreviousMonths ?? 0,
      cumplidas: b.completedOnTime ?? 0,
      // “Cumplidas tarde” = tardías del mes + cumplidas de meses anteriores
      cumplidasTarde: (b.completedLate ?? 0) + (b.completedPreviousMonths ?? 0),
      anuladas: b.canceled ?? 0,
    }),
    [b]
  );

  // 4 grupos: simple + apilado + apilado + simple
  const chartData = useMemo(
    () => [
      { grupo: "En proceso", enProceso: counts.enProceso },
      {
        grupo: "Atrasadas",
        atrasadas: counts.atrasadas,
        muyAtrasadas: counts.muyAtrasadas,
      },
      {
        grupo: "Cumplidas",
        cumplidas: counts.cumplidas,
        cumplidasTarde: counts.cumplidasTarde,
      },
      { grupo: "Anuladas", anuladas: counts.anuladas },
    ],
    [counts]
  );

  // clave para re-montar el chart y re-animar cuando cambien los datos
  const animationKey = useMemo(() => JSON.stringify(chartData), [chartData]);

  const yMax = Math.max(
    ...chartData.map(
      (r) =>
        (r.enProceso ?? 0) +
        (r.atrasadas ?? 0) +
        (r.muyAtrasadas ?? 0) +
        (r.cumplidas ?? 0) +
        (r.cumplidasTarde ?? 0) +
        (r.anuladas ?? 0)
    ),
    0
  );

  const percent =
    typeof icpValue === "number"
      ? Math.round(icpValue)
      : b.totalCompleted && b.totalPlanned
      ? Math.round(
          ((b.totalCompleted ?? 0) / Math.max(1, b.totalPlanned ?? 1)) * 100
        )
      : 0;

  // animación del porcentaje y del trazo del gauge
  const animPercent = useAnimatedNumber(percent, 900);
  const animPercentInt = Math.round(animPercent);

  // Tooltip compacto
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const total = payload.reduce(
      (acc: number, it: any) => acc + (it.value ?? 0),
      0
    );
    return (
      <div className="rounded-md border bg-white px-3 py-2 text-xs shadow-md">
        <div className="mb-1 font-medium text-gray-900">{label}</div>
        {payload.map((it: any) => (
          <div key={it.dataKey} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ backgroundColor: it.color }}
            />
            <span className="text-gray-600">
              {it.name}: {it.value}
            </span>
          </div>
        ))}
        {payload.length > 1 && (
          <div className="mt-1 border-t pt-1 text-gray-700">Total: {total}</div>
        )}
      </div>
    );
  };

  // ==== Shapes para redondear correctamente ====
  const RoundedTop = (props: any) => (
    <Rectangle {...props} stroke="transparent" radius={[10, 10, 0, 0]} />
  );

  const roundedIfNoTop =
    (topKey: "muyAtrasadas" | "cumplidasTarde") => (props: any) => {
      const topVal = props?.payload?.[topKey] ?? 0;
      const radius =
        topVal > 0
          ? ([0, 0, 0, 0] as [number, number, number, number])
          : [10, 10, 0, 0];
      return <Rectangle {...props} stroke="transparent" radius={radius} />;
    };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Estados de prioridades</CardTitle>
        <p className="text-sm text-muted-foreground">
          Estado actual e índice de cumplimiento
        </p>
      </CardHeader>

      <CardContent className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        {/* IZQUIERDA: BARRAS */}
        <div className="w-full min-w-0 pr-4 md:pr-6 border-r md:border-r border-gray-200">
          <div className="h-[220px] md:h-[240px] lg:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                key={animationKey}
                data={chartData}
                barSize={42}
                barGap={24}
                margin={{ top: 6, right: 4, bottom: 0, left: 4 }}
              >
                <XAxis
                  dataKey="grupo"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickFormatter={() => ""}
                />
                <YAxis
                  domain={[0, Math.max(3, yMax)]}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* En proceso */}
                <Bar
                  name="En proceso"
                  dataKey="enProceso"
                  fill={COLORS.enProceso}
                  shape={RoundedTop}
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                />

                {/* Atrasadas (stack) */}
                <Bar
                  name="Atrasadas"
                  dataKey="atrasadas"
                  stackId="atrasadas"
                  fill={COLORS.atrasadas}
                  shape={roundedIfNoTop("muyAtrasadas")}
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                />
                <Bar
                  name="Muy atrasadas"
                  dataKey="muyAtrasadas"
                  stackId="atrasadas"
                  fill={COLORS.muyAtrasadas}
                  shape={RoundedTop}
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                />

                {/* Cumplidas (stack) */}
                <Bar
                  name="Cumplidas"
                  dataKey="cumplidas"
                  stackId="cumplidas"
                  fill={COLORS.cumplidas}
                  shape={roundedIfNoTop("cumplidasTarde")}
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                />
                <Bar
                  name="Cumplidas tarde"
                  dataKey="cumplidasTarde"
                  stackId="cumplidas"
                  fill={COLORS.cumplidasTarde}
                  shape={RoundedTop}
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                />

                {/* Anuladas */}
                <Bar
                  name="Anuladas"
                  dataKey="anuladas"
                  fill={COLORS.anuladas}
                  shape={RoundedTop}
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* LEYENDA */}
          <div className="mt-3 flex flex-wrap items-start justify-between gap-x-8 gap-y-2 px-2">
            <Legend
              color={COLORS.enProceso}
              label="En proceso"
              count={counts.enProceso}
            />
            <Legend
              color={COLORS.atrasadas}
              label="Atrasadas"
              count={counts.atrasadas}
            />
            <Legend
              color={COLORS.muyAtrasadas}
              label="Muy atrasadas"
              count={counts.muyAtrasadas}
            />
            <Legend
              color={COLORS.cumplidas}
              label="Cumplidas"
              count={counts.cumplidas}
            />
            <Legend
              color={COLORS.cumplidasTarde}
              label="Cumplidas tarde"
              count={counts.cumplidasTarde}
            />
            <Legend
              color={COLORS.anuladas}
              label="Anuladas"
              count={counts.anuladas}
            />
          </div>
        </div>

        {/* DERECHA: ICP (gauge con animación) */}
        <div className="flex min-h-[220px] md:min-h-[240px] lg:min-h-[260px] flex-col items-center justify-center">
          <div className="mb-2 text-center">
            <div className="text-sm text-muted-foreground">ICP</div>
            <div className="text-xs text-muted-foreground">
              Índice de Cumplimiento
            </div>
          </div>

          <div className="relative h-28 w-28">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              {/* base */}
              <path
                className="stroke-muted"
                strokeWidth="3.8"
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* progreso animado: animamos dasharray con el valor interpolado */}
              <path
                className="stroke-green-500 transition-[stroke-dasharray] duration-700 ease-out"
                strokeWidth="3.8"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${Math.max(
                  0,
                  Math.min(100, animPercent)
                )}, 100`}
                d="
                  M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831
                "
              />
              {/* texto (también animado) */}
              <text
                x="18"
                y="20.35"
                className="fill-foreground text-[8px] rotate-90 origin-center"
                textAnchor="middle"
              >
                {Number.isFinite(animPercentInt) ? `${animPercentInt}%` : "--"}
              </text>
            </svg>
          </div>

          <div className="mt-2 text-xs text-muted-foreground">
            {totalPlanned != null && totalCompleted != null
              ? `${totalCompleted} de ${totalPlanned} cumplidas`
              : "Sin datos de ICP"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Legend({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count?: number;
}) {
  return (
    <div className="inline-flex min-w-[120px] items-center gap-2 leading-4">
      <span
        className="h-2 w-2 shrink-0 rounded-sm"
        style={{ backgroundColor: color }}
      />
      <span className="text-[11px] text-gray-600 whitespace-normal">
        {label}
        {typeof count === "number" ? `: ${count}` : ""}
      </span>
    </div>
  );
}
