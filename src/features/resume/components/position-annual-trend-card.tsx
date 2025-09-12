"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
  CartesianGrid,
  Cell,
} from "recharts";
import * as React from "react";
import type { PositionAnnualTrendPoint } from "../types/positions-overview";
import clsx from "clsx";

type Thresholds = {
  criticalMax?: number;
  acceptableMin?: number;
  acceptableMax?: number;
  excellentMin?: number;
};

type Labels = {
  critical?: string;
  acceptable?: string;
  excellent?: string;
};

const MESES_ES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export default function PositionAnnualTrendCard({
  trend,
  thresholds,
  labels,
  className,
}: {
  trend: PositionAnnualTrendPoint[] | undefined;
  thresholds?: Thresholds;
  labels?: Labels;
  className?: string;
}) {
  // defaults (mismos criterios que mapa/velocímetro)
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

  function statusByPct(p: number) {
    if (p >= th.excellentMin)
      return {
        key: "excellent" as const,
        text: lb.excellent,
        cls: "text-green-600",
        color: "#10B981",
      };
    if (p >= th.acceptableMin && p <= th.acceptableMax)
      return {
        key: "acceptable" as const,
        text: lb.acceptable,
        cls: "text-amber-600",
        color: "#F59E0B",
      };
    return {
      key: "critical" as const,
      text: lb.critical,
      cls: "text-red-600",
      color: "#EF4444",
    };
  }

  const chartData = React.useMemo(() => {
    const map = new Map<number, PositionAnnualTrendPoint>();
    (trend ?? []).forEach((p) => map.set(p.month, p));
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const it = map.get(m);
      const perf = Number(it?.performance ?? 0);
      return {
        m: MESES_ES[i],
        performance: perf,
      };
    });
  }, [trend]);

  // Tooltip como el del mapa (sin repeticiones)
  function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const p = payload[0]?.payload as { performance: number };
    const st = statusByPct(p.performance ?? 0);

    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-md px-4 py-3">
        <div className="font-semibold text-gray-900">Mes: {label}</div>
        <div className="text-sm text-gray-800">
          Performance: {p.performance}%
        </div>
        <div className={clsx("mt-1 text-sm font-medium", st.cls)}>
          Estado: {st.text}
        </div>
      </div>
    );
  }

  return (
    <Card
      className={clsx("border-0 shadow-sm h-full flex flex-col", className)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-gray-900">
          Tendencia anual de la posición
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 16, left: 8, bottom: 16 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="m"
              tickMargin={8}
              tick={{ fontSize: 12, fill: "#6b7280" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              label={{
                value: "Porcentaje",
                angle: -90,
                position: "insideLeft",
                offset: 10,
                style: { fill: "#6b7280", fontSize: 12 },
              }}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* ÚNICA BARRA: PERFORMANCE con color por estado */}
            <Bar
              dataKey="performance"
              name="Performance"
              radius={[4, 4, 0, 0]}
              barSize={16}
            >
              {chartData.map((d, i) => {
                const c = statusByPct(d.performance).color;
                return <Cell key={`cell-${i}`} fill={c} />;
              })}
            </Bar>

            {/* LÍNEA: PERFORMANCE */}
            <Line
              type="monotone"
              dataKey="performance"
              stroke="#a3e635"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            >
              <LabelList
                dataKey="performance"
                content={(p: any) => {
                  const { x, y, value } = p;
                  if (x == null || y == null) return null;
                  return (
                    <text
                      x={x}
                      y={y - 8}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#374151"
                    >
                      {value}%
                    </text>
                  );
                }}
              />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
