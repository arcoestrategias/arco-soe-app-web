"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  ReferenceLine,
} from "recharts";
import { getMeasurements } from "../services/objectiveGoalsService";

const CALC_METHOD_LABEL: Record<string, string> = {
  ACCUMULATIVE: "Acumulativo",
  AVERAGE: "Promedio",
  LAST_VALUE: "Último valor",
};
const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

type Props = {
  open: boolean;
  onClose: () => void;
  goalId: string;
  month: number;
  year: number;
  calculationMethod?: string | null;
  periodicity?: string | null;
  measurementCount?: number | null;
  goalValue?: number | null;
};

export function MeasurementChartModal({
  open,
  onClose,
  goalId,
  month,
  year,
  calculationMethod,
  periodicity,
  measurementCount,
  goalValue,
}: Props) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("mediciones");

  useEffect(() => {
    if (!open || !goalId) return;
    setLoading(true);
    getMeasurements(goalId)
      .then((rows: any) => {
        const rawChart = (rows ?? []).map((m: any) => ({
          index: `M${m.index}`,
          valor: m.result != null ? Number(m.result) : 0,
          fecha: m.measuredAt ? m.measuredAt.slice(0, 10) : "—",
          observacion: m.observation ?? "—",
          isIgnore: m.isIgnore ?? false,
        }));
        const vals = rawChart
          .filter((d: any) => d.valor > 0 && !d.isIgnore)
          .map((d: any) => d.valor);
        const consolidated = calculationMethod === "AVERAGE"
          ? (vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0)
          : calculationMethod === "LAST_VALUE"
            ? (vals.length > 0 ? vals[vals.length - 1] : 0)
            : vals.reduce((a: number, b: number) => a + b, 0);
        setData(rawChart);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [open, goalId]);

  const methodLabel = calculationMethod
    ? (CALC_METHOD_LABEL[calculationMethod] ?? calculationMethod)
    : "—";

  const consolidated = data
    .filter((d) => d.valor > 0 && !d.isIgnore)
    .reduce((a, b) => a + b.valor, 0);
  const values = data
    .filter((d) => d.valor > 0 && !d.isIgnore)
    .map((d) => d.valor);
  const avg =
    values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const lastVal = values.length > 0 ? values[values.length - 1] : 0;

  let consolidatedResult: number | null = null;
  if (calculationMethod === "AVERAGE") consolidatedResult = avg;
  else if (calculationMethod === "LAST_VALUE") consolidatedResult = lastVal;
  else consolidatedResult = consolidated;

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-lg border bg-white shadow-md px-3 py-2 text-xs">
        <p className="font-semibold">{d.index}</p>
        <p>Valor: {d.valor}</p>
        <p>Fecha: {d.fecha}</p>
        <p>Obs: {d.observacion}</p>
        {d.isIgnore && (
          <p className="text-red-500 font-medium">No considerado</p>
        )}
      </div>
    );
  };

  const dataValues = data.map((d) => d.valor);
  const dataMax = dataValues.length > 0 ? Math.max(...dataValues, 0) : 0;
  const dataMin = dataValues.length > 0 ? Math.min(...dataValues, 0) : 0;
  const refResult = consolidatedResult ?? dataMax;
  const refMeta = goalValue ?? dataMax;
  const chartMaxMediciones = Math.ceil(Math.max(dataMax, refResult > 0 ? refResult : 0) * 1.15 || 10);
  const chartMaxComparativa = Math.ceil(Math.max(dataMax, refMeta > 0 ? refMeta : 0) * 1.15 || 10);
  const chartMin = Math.floor(dataMin > 0 ? 0 : dataMin * 1.2);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>
            Mediciones {MONTH_NAMES[month - 1]} {year}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
            {periodicity && (
              <span className="whitespace-nowrap">
                Periodicidad:{" "}
                <strong>
                  {periodicity === "WEEKLY"
                    ? "Semanal"
                    : periodicity === "CUSTOM"
                      ? "Personalizado"
                      : periodicity}
                </strong>
              </span>
            )}
            <span className="whitespace-nowrap">
              Método: <strong>{methodLabel}</strong>
            </span>
            {goalValue != null && (
              <span className="whitespace-nowrap">
                Meta: <strong>{goalValue}</strong>
              </span>
            )}
            <span className="whitespace-nowrap">
              Resultado:{" "}
              <strong>
                {consolidatedResult != null
                  ? consolidatedResult.toFixed(2)
                  : "—"}
              </strong>
            </span>
            <span className="whitespace-nowrap">
              Mediciones:{" "}
              <strong>
                {values.length}/{measurementCount ?? data.length}
              </strong>
            </span>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mediciones">Mediciones</TabsTrigger>
            <TabsTrigger value="comparativa">Comparativa</TabsTrigger>
          </TabsList>

          <TabsContent value="mediciones" className="mt-4">
            <div className="h-[350px] w-full">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : data.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No hay mediciones registradas.
                </div>
              ) : (
                <ResponsiveContainer>
                  <ComposedChart
                    data={data}
                    margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[chartMin, chartMaxMediciones]} />
                    <ReferenceLine y={0} stroke="#94A3B8" strokeWidth={1} />
                    <Tooltip content={<CustomTooltip />} />
                    {consolidatedResult != null && (
                      <ReferenceLine
                        y={consolidatedResult}
                        stroke="#22C55E"
                        strokeDasharray="6 3"
                        strokeWidth={2}
                        label={{
                          value: `Resultado: ${consolidatedResult.toFixed(2)}`,
                          position: "insideBottomLeft",
                          fill: "#22C55E",
                          fontSize: 11,
                        }}
                      />
                    )}
                    <Bar dataKey="valor" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    <Line
                      type="monotone"
                      dataKey="valor"
                      stroke="#2563EB"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#2563EB" }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>

          <TabsContent value="comparativa" className="mt-4">
            <div className="h-[350px] w-full">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : data.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No hay mediciones registradas.
                </div>
              ) : (
                <ResponsiveContainer>
                  <ComposedChart
                    data={data}
                    margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[chartMin, chartMaxComparativa]} />
                    <ReferenceLine y={0} stroke="#94A3B8" strokeWidth={1} />
                    <Tooltip content={<CustomTooltip />} />
                    {goalValue != null && (
                      <ReferenceLine
                        y={goalValue}
                        stroke="#22C55E"
                        strokeDasharray="6 3"
                        strokeWidth={2}
                        label={{
                          value: `Meta: ${goalValue}`,
                          position: "insideBottomLeft",
                          fill: "#22C55E",
                          fontSize: 11,
                        }}
                      />
                    )}
                    <Bar dataKey="valor" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    <Line
                      type="monotone"
                      dataKey="valor"
                      stroke="#2563EB"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#2563EB" }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {data.length > 0 && (
          <div className="max-h-[200px] overflow-y-auto border rounded-md">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="text-left p-2 font-medium">#</th>
                  <th className="text-left p-2 font-medium">Valor</th>
                  <th className="text-left p-2 font-medium">Fecha</th>
                  <th className="text-left p-2 font-medium">Observación</th>
                  <th className="text-center p-2 font-medium">No considerar</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((d, i) => (
                  <tr
                    key={i}
                    className={
                      d.isIgnore ? "bg-gray-50 text-muted-foreground" : ""
                    }
                  >
                    <td className="p-2">{d.index}</td>
                    <td className="p-2">{d.valor != null ? d.valor : "—"}</td>
                    <td className="p-2">{d.fecha}</td>
                    <td className="p-2">{d.observacion}</td>
                    <td className="p-2 text-center">
                      {d.isIgnore ? "✕" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Registradas: {values.length}
          </Badge>
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-600 border-gray-200"
          >
            Pendientes: {(measurementCount ?? data.length) - values.length}
          </Badge>
          <Badge
            variant="outline"
            className="bg-red-50 text-red-600 border-red-200"
          >
            No consideradas: {data.filter((d) => d.isIgnore).length}
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}
