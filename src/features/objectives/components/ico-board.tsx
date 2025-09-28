// features/objectives/components/ico-board.tsx
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, Calendar, Target } from "lucide-react";
import type {
  IcoBoardData,
  IcoBoardMonthlyAverage,
  IcoMonthlyPoint,
} from "../types/ico-board";

type IcoBoardProps = {
  data?: IcoBoardData; // ⬅️ ahora opcional para soportar el primer render
  year: number | string;
  className?: string;
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

const MEASUREMENT_LABEL: Record<string, string> = {
  POR: "Porcentaje",
  RAT: "Ratio",
  UNI: "Unidad",
  MON: "Moneda",
  UNC: "Único",
};

const getMeasurementLabel = (m?: string | null) => {
  if (!m) return "—";
  const key = String(m).toUpperCase();
  return MEASUREMENT_LABEL[key] ?? key; // fallback al código si no está mapeado
};
// ----- helpers visuales -----
function formatPercent(n: number | null | undefined) {
  // Sin redondeo en front: mostramos exactamente lo que venga
  return typeof n === "number" ? `${n}%` : "0%";
}

function getAvgBadgeClass(value: number | null | undefined) {
  if (value == null) return "bg-gray-200 text-gray-600 border-gray-300 border";
  if (value >= 95) return "bg-green-50 text-green-700 border-green-200 border";
  if (value >= 85) return "bg-amber-50 text-amber-700 border-amber-200 border";
  return "bg-red-50 text-red-700 border-red-200 border";
}

function cellText(point?: IcoMonthlyPoint) {
  if (!point || !point.isMeasured) return ""; // celda vacía si no hay medición
  const show = point.hasCompliance ? point.ico : 0; // "0%" si no hay compliance
  return formatPercent(show);
}

export default function IcoBoard({ data, year, className }: IcoBoardProps) {
  // ⛑️ Guard: si aún no hay data o resume, no renderizamos (el padre ya muestra loading)
  if (!data?.resume) return null;

  const { activeIndicators, generalAverage, lastActiveMonth } = data.resume;

  // Filas por objetivo (normalizadas al año)
  const rows = React.useMemo(() => {
    const objetivos = data?.listObjectives ?? [];
    return objetivos.map(({ objective }) => {
      const title = objective?.indicator?.name ?? "";
      // Meta SIN porcentaje
      const subtitle = `Meta: ${Math.round(Number(objective?.goalValue ?? 0))}`;
      // Nueva línea: Unidad (desde indicator.measurement)
      const unitLabel = `Medida: ${getMeasurementLabel(
        objective?.indicator?.measurement
      )}`;

      const cells = MONTH_INDEXES.map((m) => {
        const point = objective?.icoMonthly?.find(
          (x) => x.month === m && String(x.year) === String(year)
        );
        return { month: m, point };
      });

      return { title, subtitle, unitLabel, cells };
    });
  }, [data, year]);

  // Fila de promedios (usa color del back si viene)
  type AvgWithColor = IcoBoardMonthlyAverage & {
    lightNumeric?: number | null;
    lightColorHex?: string | null;
  };

  const footer = React.useMemo(() => {
    const avgs: (IcoBoardMonthlyAverage | AvgWithColor)[] =
      (data?.monthlyAverages as any) ?? [];
    return MONTH_INDEXES.map((m) => {
      const a = avgs.find(
        (x) => x.month === m && String((x as any).year) === String(year)
      ) as AvgWithColor | undefined;
      return {
        month: m,
        averageIco: a?.averageIco ?? 0,
        measuredCount: a?.measuredCount ?? 0,
        unmeasuredCount: a?.unmeasuredCount ?? 0,
        lightNumeric: a?.lightNumeric ?? null,
        lightColorHex: a?.lightColorHex ?? null,
      };
    });
  }, [data, year]);

  return (
    <div className={["space-y-6 font-system", className ?? ""].join(" ")}>
      {/* Header con estadísticas generales (todo del back) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-bold">
                  Indicadores Activos
                </p>
                <p className="text-xl font-bold text-blue-700">
                  {activeIndicators}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-green-100">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-green-600 font-bold">
                  Promedio Anual
                </p>
                {/* El back ya envía redondeado; no usar toFixed aquí */}
                <p className="text-xl font-bold text-green-700">
                  {generalAverage}%
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-50 to-orange-100">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-orange-600 font-bold">
                  Último Mes Activo
                </p>
                <p className="text-xl font-bold text-orange-700">
                  {lastActiveMonth.label}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla ICO */}
      <Card className="bg-transparent border-0 shadow-none p-0">
        <div className="rounded-xl overflow-hidden shadow-lg">
          {/* Header naranja sin radios propios (evita “corte” blanco) */}
          <div>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <h2 className="text-lg text-gray-900 font-semibold">
                Índices de Cumplimiento de Objetivos (ICO)
              </h2>
            </div>
          </div>

          {/* Cuerpo blanco */}
          <div className="bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                  <tr>
                    <th className="text-left p-4 font-semibold text-sm text-gray-700 bg-gray-100 border-r border-gray-200 w-64 min-w-[250px]">
                      Indicador
                    </th>
                    {MESES.map((mes) => (
                      <th
                        key={mes}
                        className="text-center p-4 font-semibold text-xs text-gray-700 border-r border-gray-200 last:border-r-0 w-20"
                      >
                        {mes}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {/* Filas por objetivo */}
                  {rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="p-4 bg-gray-50/50 border-r border-gray-200 w-64 min-w-[250px]">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {row.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {row.subtitle}
                          </p>
                          <p className="text-[11px] text-gray-500/90">
                            {row.unitLabel}
                          </p>
                        </div>
                      </td>

                      {row.cells.map(({ month, point }) => {
                        // Sin medición => celda vacía
                        if (!point || !point.isMeasured) {
                          return (
                            <td
                              key={month}
                              className="p-3 border-r border-gray-200 last:border-r-0 text-center w-20"
                            />
                          );
                        }

                        const text = cellText(point); // "0%" si no hay compliance
                        const style = {
                          backgroundColor: point.lightColorHex ?? undefined,
                        }; // color del back
                        const className =
                          "inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium min-w-[45px] text-gray-900 border border-gray-200";

                        return (
                          <td
                            key={month}
                            className="p-3 border-r border-gray-200 last:border-r-0 text-center w-20"
                          >
                            <div className={className} style={style}>
                              {text}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Fila del ICO Mensual (usa color del back si viene) */}
                  <tr className="bg-blue-50/50 border-t-2 border-blue-200">
                    <td className="p-4 bg-blue-100 border-r border-blue-200 w-64 min-w-[250px]">
                      <div>
                        <p className="text-sm font-bold text-blue-900">
                          ICO Mensual
                        </p>
                        <p className="text-xs text-blue-600">
                          Promedio de cumplimiento
                        </p>
                      </div>
                    </td>

                    {footer.map(({ month, averageIco, lightColorHex }) => {
                      const base =
                        "inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-bold min-w-[45px] border";
                      const style = lightColorHex
                        ? { backgroundColor: lightColorHex }
                        : undefined;
                      const className = lightColorHex
                        ? `${base} text-gray-900 border-gray-200`
                        : `${base} ${getAvgBadgeClass(averageIco)}`;

                      return (
                        <td
                          key={month}
                          className="p-3 border-r border-blue-200 last:border-r-0 text-center w-20"
                        >
                          <div className={className} style={style}>
                            {formatPercent(averageIco)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      {/* Leyenda del semáforo (visual) */}
      <Card className="border-0 shadow-sm bg-gray-50">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Leyenda del Semáforo ICO
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="bg-green-50 text-green-700 border-green-200 border text-xs px-2 py-1 rounded-md font-medium">
                  ≥99%
                </div>
                <span className="text-xs text-gray-600">Aceptable</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-amber-50 text-amber-700 border-amber-200 border text-xs px-2 py-1 rounded-md font-medium">
                  75–98.99%
                </div>
                <span className="text-xs text-gray-600">Esperado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-red-50 text-red-700 border-red-200 border text-xs px-2 py-1 rounded-md font-medium">
                  &lt;75%
                </div>
                <span className="text-xs text-gray-600">Inaceptable</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border border-gray-300 rounded-md bg-white"></div>
                <span className="text-xs text-gray-600">Sin medición</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-gray-200 text-gray-600 border-gray-300 border text-xs px-2 py-1 rounded-md font-medium">
                  0%
                </div>
                <span className="text-xs text-gray-600">Sin registrar</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
