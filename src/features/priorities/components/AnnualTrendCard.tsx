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
} from "recharts";
import { useMemo } from "react";
import { usePrioritiesIcpSeries } from "@/features/priorities/hooks/use-priorities";

const MONTHS_ES = [
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

function formatIcpLabel(v?: number) {
  if (typeof v !== "number" || Number.isNaN(v)) return "ICP: 0 %";
  // redondeo .xx a 0 decimales
  return `ICP: ${Math.round(v)} %`;
}

export default function AnnualTrendCard({
  positionId,
  year,
}: {
  positionId?: string;
  year: number;
}) {
  const from = `${year}-01`;
  const to = `${year}-12`;
  const enabled = !!positionId;

  const { data, isLoading } = usePrioritiesIcpSeries(
    { positionId, from, to },
    enabled
  );

  // Armar 12 meses siempre, para evitar “saltos” si falta alguno
  const chartData = useMemo(() => {
    const byMonth = new Map<number, any>();
    (data?.items ?? []).forEach((it) => {
      const completed =
        (it.completedOnTime ?? 0) +
        (it.completedLate ?? 0) +
        (it.completedPreviousMonths ?? 0);
      byMonth.set(it.month, {
        m: MONTHS_ES[it.month - 1],
        completed,
        planned: it.totalPlanned ?? 0,
        icp: it.icp ?? 0,
      });
    });
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return (
        byMonth.get(m) ?? {
          m: MONTHS_ES[i],
          completed: 0,
          planned: 0,
          icp: 0,
        }
      );
    });
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tendencia Anual</CardTitle>
        <p className="text-sm text-muted-foreground">
          Evolución de prioridades en el año
        </p>
      </CardHeader>
      <CardContent className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 24, left: 8, bottom: 24 }}
          >
            {/* Eje X */}
            <XAxis
              dataKey="m"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12, fill: "#6b7280" }}
            />
            {/* Eje izquierdo: cantidades */}
            <YAxis
              yAxisId="left"
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              label={{
                value: "# de prioridades",
                angle: -90,
                position: "insideLeft",
                style: { fill: "#6b7280", fontSize: 12 },
              }}
              domain={[
                0,
                (dataMax: number) =>
                  Math.max(5, Math.ceil((dataMax ?? 0) * 1.2)),
              ]}
            />
            {/* Eje derecho: ICP */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              label={{
                value: "Porcentaje",
                angle: 90,
                position: "insideRight",
                style: { fill: "#6b7280", fontSize: 12 },
              }}
              domain={[0, 100]}
            />
            <Tooltip
              formatter={(value: any, name: any) => {
                if (name === "completed") return [value, "Cumplidas"];
                if (name === "planned") return [value, "Planeadas"];
                if (name === "icp")
                  return [`${Math.round(value as number)}%`, "ICP"];
                return [value, name];
              }}
              labelFormatter={(label: any) => `Mes: ${label}`}
            />

            {/* Barra 1: Cumplidas (a tiempo + tarde + meses anteriores) */}
            <Bar
              yAxisId="left"
              dataKey="completed"
              fill="#22c55e" // verde (cumplidas)
              radius={[4, 4, 0, 0]}
              barSize={18}
            />

            {/* Barra 2: Planeadas totales */}
            <Bar
              yAxisId="left"
              dataKey="planned"
              fill="#0ea5b7" // cian/teal (planeadas)
              radius={[4, 4, 0, 0]}
              barSize={18}
            />

            {/* Línea ICP */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="icp"
              stroke="#a3e635" // lima (similar a tu maqueta)
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            >
              <LabelList
                dataKey="icp"
                content={(props: any) => {
                  const { x, y, value } = props;
                  if (x == null || y == null) return null;
                  return (
                    <text
                      x={x}
                      y={y - 10}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#6b7280"
                    >
                      {formatIcpLabel(typeof value === "number" ? value : 0)}
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
