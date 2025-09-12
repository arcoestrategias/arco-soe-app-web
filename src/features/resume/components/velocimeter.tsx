// features/resumen/components/velocimeter.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Thresholds = {
  criticalMax?: number; // default 75
  acceptableMin?: number; // default 75
  acceptableMax?: number; // default 98.99
  excellentMin?: number; // default 99
};

type Labels = {
  critical?: string; // default "Crítico"
  acceptable?: string; // default "Aceptable"
  excellent?: string; // default "Excelente"
};

interface VelocimeterProps {
  value: number; // porcentaje
  title?: string; // título del widget
  metricLabel?: string; // etiqueta pequeña dentro del círculo (ej. "ICO")
  thresholds?: Thresholds; // umbrales configurables
  labels?: Labels; // textos configurables
}

export default function Velocimeter({
  value,
  title = "Indicador",
  metricLabel,
  thresholds,
  labels,
}: VelocimeterProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  // Defaults
  const th = useMemo(
    () => ({
      criticalMax: thresholds?.criticalMax ?? 75,
      acceptableMin: thresholds?.acceptableMin ?? 75,
      acceptableMax: thresholds?.acceptableMax ?? 98.99,
      excellentMin: thresholds?.excellentMin ?? 99,
    }),
    [thresholds]
  );

  const lb = useMemo(
    () => ({
      critical: labels?.critical ?? "Crítico",
      acceptable: labels?.acceptable ?? "Aceptable",
      excellent: labels?.excellent ?? "Excelente",
    }),
    [labels]
  );

  useEffect(() => {
    const t = setTimeout(() => setAnimatedValue(value), 500);
    return () => clearTimeout(t);
  }, [value]);

  // Zona (sin redondeo)
  const zone: "critical" | "acceptable" | "excellent" = useMemo(() => {
    if (animatedValue >= th.excellentMin) return "excellent";
    if (animatedValue >= th.acceptableMin && animatedValue <= th.acceptableMax)
      return "acceptable";
    return "critical";
  }, [animatedValue, th]);

  const colorInfo = useMemo(() => {
    if (zone === "excellent") return { color: "#10b981", label: lb.excellent }; // verde
    if (zone === "acceptable")
      return { color: "#f59e0b", label: lb.acceptable }; // ámbar
    return { color: "#ef4444", label: lb.critical }; // rojo
  }, [zone, lb]);

  // SVG progress
  const circumference = 2 * Math.PI * 45;
  const dash = Math.max(0, Math.min(100, animatedValue)); // clamp 0..100 solo para visual
  const strokeDashoffset = circumference - (dash / 100) * circumference;

  // Mostrar con 2 decimales (solo UI)
  const display = Number.isFinite(animatedValue)
    ? `${Number(animatedValue).toFixed(2)}%`
    : "0.00%";

  // Leyendas dinámicas
  const legendCritical = `${lb.critical} (<${th.criticalMax}%)`;
  const legendAcceptable = `${lb.acceptable} (${th.acceptableMin}–${th.acceptableMax}%)`;
  const legendExcellent = `${lb.excellent} (≥${th.excellentMin}%)`;

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-8 text-center heading-optimized">
          {title}
        </h3>

        {/* Circle Chart */}
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32">
            <svg
              className="w-32 h-32 transform -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke={colorInfo.color}
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 2s ease-in-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Tamaño ajustado para caber siempre */}
              <div className="text-2xl md:text-2xl font-bold text-gray-900 leading-none">
                {display}
              </div>
              {metricLabel ? (
                <div className="text-xs text-gray-600 mt-1">{metricLabel}</div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Status pill */}
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium"
            style={{
              backgroundColor: `${colorInfo.color}20`,
              color: colorInfo.color,
            }}
          >
            <div
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: colorInfo.color }}
            />
            {colorInfo.label}
          </div>
        </div>

        {/* Scale */}
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-2000 ease-out"
              style={{ width: `${dash}%`, backgroundColor: colorInfo.color }}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-xs text-gray-600">{legendCritical}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="text-xs text-gray-600">{legendAcceptable}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-xs text-gray-600">{legendExcellent}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
