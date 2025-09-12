"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { PositionOverviewItem } from "../types/positions-overview";
import clsx from "clsx";

type PositionsAssignmentsChartProps = {
  positions: PositionOverviewItem[];
  className?: string;
  barSize?: number;
};

type Row = {
  key: string;
  name: string;
  user: string; // mantenemos string
  objetivos: number;
  prioridades: number;
  proyectos: number;
};

const toRows = (list: PositionOverviewItem[]): Row[] =>
  list.map((p) => ({
    key: p.idPosition,
    name: p.namePosition,
    user: p.nameUser ?? "", // <-- coacción para evitar el error de tipos
    objetivos: Number(p.numObjectives ?? 0),
    prioridades: Number(p.numPriorities ?? 0),
    proyectos: Number(p.numProjects ?? 0),
  }));

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as Row;
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-md px-4 py-3">
      <div className="font-semibold text-gray-900">{row.name}</div>
      {row.user && <div className="text-xs text-gray-600 mb-1">{row.user}</div>}
      <div className="text-sm text-gray-800">Objetivos: {row.objetivos}</div>
      <div className="text-sm text-gray-800">
        Prioridades: {row.prioridades}
      </div>
      <div className="text-sm text-gray-800">Proyectos: {row.proyectos}</div>
    </div>
  );
}

export default function PositionsAssignmentsChart({
  positions,
  className,
  barSize = 18,
}: PositionsAssignmentsChartProps) {
  const data = React.useMemo(() => toRows(positions), [positions]);

  const C_OBJ = "#6366F1";
  const C_PRI = "#14B8A6";
  const C_PRO = "#F43F5E";

  return (
    <Card
      className={clsx("border-0 shadow-sm h-full flex flex-col", className)}
    >
      <div className="p-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-gray-900">Posiciones</CardTitle>
          <p className="text-xs text-gray-600">
            Total de asignaciones por posición en el periodo seleccionado.
          </p>
        </CardHeader>

        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 16, left: 0, bottom: 48 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={false}
                axisLine={{ stroke: "#9CA3AF" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#374151" }}
                label={{
                  value: "Total de asignaciones",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  dy: 75,
                  style: { fill: "#374151" },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                align="center"
                height={28}
                wrapperStyle={{ fontSize: 12, color: "#374151" }}
                formatter={(v) =>
                  v === "objetivos"
                    ? "Objetivos"
                    : v === "prioridades"
                    ? "Prioridades"
                    : "Proyectos"
                }
              />
              <Bar
                dataKey="objetivos"
                name="Objetivos"
                fill={C_OBJ}
                radius={[4, 4, 0, 0]}
                barSize={barSize}
              />
              <Bar
                dataKey="prioridades"
                name="Prioridades"
                fill={C_PRI}
                radius={[4, 4, 0, 0]}
                barSize={barSize}
              />
              <Bar
                dataKey="proyectos"
                name="Proyectos"
                fill={C_PRO}
                radius={[4, 4, 0, 0]}
                barSize={barSize}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
