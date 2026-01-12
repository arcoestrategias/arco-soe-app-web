"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  ReferenceLine,
} from "recharts";
import { Card } from "@/components/ui/card";

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

type Props = {
  open: boolean;
  onClose: () => void;
  objective: any; // Usamos any para flexibilidad con la estructura del backend
  year: number | string;
};

export function IndicatorEvolutionModal({
  open,
  onClose,
  objective,
  year,
}: Props) {
  const { chartData, averageIco } = React.useMemo(() => {
    if (!objective?.icoMonthly) return { chartData: [], averageIco: 0 };

    // Filtramos por año y ordenamos por mes
    const points = (objective.icoMonthly as any[])
      .filter((p) => String(p.year) === String(year))
      .sort((a, b) => a.month - b.month);

    // Calcular promedio solo de meses medidos
    const measured = points.filter((p) => p.isMeasured);
    const total = measured.reduce((acc, curr) => acc + (curr.ico ?? 0), 0);
    const avg = measured.length > 0 ? total / measured.length : 0;

    // Mapeamos a estructura de gráfico, rellenando meses faltantes si es necesario
    // (Aquí mostramos solo los meses que tienen datos o existen en el array)
    const data = points.map((p) => {
      // Lógica para obtener la meta correcta (similar a compliance modal)
      const goal =
        typeof p.newGoalValue === "number"
          ? p.newGoalValue
          : typeof p.goalValue === "number"
          ? p.goalValue
          : 0;

      return {
        name: MESES[p.month - 1],
        month: p.month,
        real: p.realValue ?? 0,
        meta: goal,
        ico: p.ico ?? 0,
        isMeasured: p.isMeasured,
      };
    });

    return { chartData: data, averageIco: avg };
  }, [objective, year]);

  if (!objective) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Evolución del Indicador</DialogTitle>
          <DialogDescription>
            {objective.indicator?.name ?? objective.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="values" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="values">Valores (Real vs Meta)</TabsTrigger>
            <TabsTrigger value="compliance">Cumplimiento (%)</TabsTrigger>
          </TabsList>

          {/* VISTA 1: Comparativa de Valores (Barras) */}
          <TabsContent value="values" className="mt-4">
            <Card className="p-4 border-0 shadow-none">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="name"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tick={{ fill: "#6b7280" }}
                    />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#6b7280" }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.04)" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar
                      dataKey="real"
                      name="Valor Real"
                      fill="#3b82f6" // blue-500
                      radius={[6, 6, 0, 0]}
                      barSize={20}
                    />
                    <Bar
                      dataKey="meta"
                      name="Meta"
                      fill="#cbd5e1" // slate-300
                      radius={[6, 6, 0, 0]}
                      barSize={20}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Comparativa directa entre el valor esperado (Meta) y el valor
                obtenido (Real) mes a mes.
              </p>
            </Card>
          </TabsContent>

          {/* VISTA 2: Evolución de Cumplimiento (Línea/Área) */}
          <TabsContent value="compliance" className="mt-4">
            <Card className="p-4 border-0 shadow-none">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <defs>
                      <linearGradient id="colorIco" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="name"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tick={{ fill: "#6b7280" }}
                    />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      unit="%"
                      tick={{ fill: "#6b7280" }}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, "ICO"]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    {averageIco > 0 && (
                      <ReferenceLine
                        y={averageIco}
                        label={{
                          value: `Promedio: ${averageIco.toFixed(1)}%`,
                          position: "insideTopRight",
                          fill: "#f59e0b",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                        stroke="#f59e0b"
                        strokeDasharray="3 3"
                        strokeWidth={4}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="ico"
                      name="Cumplimiento (ICO)"
                      stroke="#10b981" // emerald-500
                      fillOpacity={1}
                      fill="url(#colorIco)"
                      strokeWidth={4}
                    />
                    <Line
                      type="monotone"
                      dataKey="ico"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#fff", strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                      hide // Solo usamos Area para visual, Line oculta para tooltip si se quiere
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Porcentaje de cumplimiento logrado respecto a la meta
                establecida.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
