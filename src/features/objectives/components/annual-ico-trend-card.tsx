// features/objectives/components/annual-ico-trend-card.tsx
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  Cell,
  Line,
} from "recharts";
import { TrendingUp } from "lucide-react";
import type { IcoBoardData, IcoBoardMonthlyAverage } from "../types/ico-board";

type AnnualIcoTrendCardProps = {
  data?: IcoBoardData;
  year: number | string;
  className?: string;
  lineStroke?: string; // color de la curva
};

const MESES = [
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
const MONTH_INDEXES = Array.from({ length: 12 }, (_, i) => i + 1);

type AvgWithColor = IcoBoardMonthlyAverage & {
  lightNumeric?: number | null;
  lightColorHex?: string | null;
};

// --- Tooltip personalizado (evita duplicados) ---
function CustomTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ dataKey?: string; value?: number }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const icoEntry = payload.find((p) => p.dataKey === "ico");
  const value = typeof icoEntry?.value === "number" ? icoEntry.value : 0;

  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 shadow-sm text-sm">
      <div className="font-medium text-gray-900">Mes: {label}</div>
      <div className="mt-1">
        <span className="text-gray-700 font-medium">ICO: </span>
        <span className="text-gray-900">{value}%</span>
      </div>
    </div>
  );
}

export default function AnnualIcoTrendCard({
  data,
  year,
  className,
  lineStroke = "#22c55e",
}: AnnualIcoTrendCardProps) {
  const chartData = React.useMemo(() => {
    const avgs: (IcoBoardMonthlyAverage | AvgWithColor)[] =
      (data?.monthlyAverages as any) ?? [];
    const byMonth = new Map<number, AvgWithColor>();
    avgs.forEach((a) => {
      if (String((a as any).year) === String(year))
        byMonth.set(a.month, a as AvgWithColor);
    });

    return MONTH_INDEXES.map((m) => {
      const a = byMonth.get(m);
      return {
        m: MESES[m - 1],
        ico: a?.averageIco ?? 0, // sin redondeo
        color: a?.lightColorHex ?? "#E5E7EB", // fallback gris claro
        lightNumeric: a?.lightNumeric ?? null,
        measuredCount: a?.measuredCount ?? 0,
        unmeasuredCount: a?.unmeasuredCount ?? 0,
      };
    });
  }, [data, year]);

  const maxIco = Math.max(
    0,
    ...chartData.map((d) => (typeof d.ico === "number" ? d.ico : 0))
  );
  const yMax = Math.max(5, Math.ceil(maxIco * 1.1));

  return (
    <Card
      className={[
        "bg-transparent border-0 shadow-none p-0 my-6",
        className ?? "",
      ].join(" ")}
    >
      <div className="rounded-xl overflow-hidden shadow-lg">
        <div>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="text-lg text-gray-900 font-semibold">
              Tendencia Anual ICO
            </h2>
          </div>
        </div>

        <div className="bg-white p-4">
          <div className="w-full h-72">
            <ResponsiveContainer>
              <ComposedChart
                data={chartData}
                margin={{ top: 30, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="m"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={{ stroke: "#e5e7eb" }}
                  width={36}
                  domain={[0, yMax]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={{ stroke: "#e5e7eb" }}
                  width={36}
                  domain={[0, 100]}
                />

                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                />

                {/* Barras ICO finas (puedes ajustar barSize a 20 como dijiste) */}
                <Bar
                  dataKey="ico"
                  yAxisId="left"
                  barSize={20}
                  radius={[6, 6, 0, 0]}
                >
                  {chartData.map((entry, idx) => (
                    <Cell key={`c-${idx}`} fill={entry.color} />
                  ))}
                  {/* ⛔️ QUITAMOS ESTE LabelList para que no quede debajo de la línea */}
                  {/* <LabelList ... /> */}
                </Bar>

                {/* Curva ICO con labels encima de todo */}
                <Line
                  type="monotone"
                  dataKey="ico"
                  yAxisId="right"
                  stroke={lineStroke}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={{ r: 3, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 5 }}
                >
                  <LabelList
                    dataKey="ico"
                    position="top"
                    formatter={(v: number) => `${v}%`}
                    style={{
                      fill: "#111827",
                      fontSize: 11,
                      fontWeight: 700,
                      // Borde blanco para que siempre se lean sobre la línea/colores
                      paintOrder: "stroke",
                      stroke: "#fff",
                      strokeWidth: 3,
                    }}
                  />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
}
