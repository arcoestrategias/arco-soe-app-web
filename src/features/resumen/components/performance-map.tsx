"use client";

import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { useState } from "react";

interface PerformanceMapProps {
  data: {
    id: number;
    x: number;
    y: number;
    z: number;
    nombre: string;
  }[];
}

export function PerformanceMap({ data }: PerformanceMapProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const getColor = (ico: number, icp: number) => {
    const performance = (ico + icp) / 2;
    if (performance >= 90) return "#10b981";
    if (performance >= 70) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="border-0 shadow-sm bg-white/50 backdrop-blur-sm rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2 heading-optimized">
        Role Performance Map
      </h3>
      <p className="text-sm text-gray-600 mb-6 text-small-optimized">
        Distribution by ICO (Y axis) and ICP (X axis)
      </p>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis type="number" dataKey="x" name="ICP" domain={[50, 100]} />
            <YAxis type="number" dataKey="y" name="ICO" domain={[50, 100]} />
            <ZAxis type="number" dataKey="z" range={[60, 200]} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  const perf = (d.y + d.x) / 2;
                  const estado =
                    perf >= 90
                      ? "Excellent"
                      : perf >= 70
                      ? "Average"
                      : "Critical";
                  return (
                    <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
                      <p className="font-medium text-gray-900">{d.nombre}</p>
                      <p className="text-sm text-gray-600">ICO: {d.y}%</p>
                      <p className="text-sm text-gray-600">ICP: {d.x}%</p>
                      <p className="text-sm text-gray-600">
                        Performance: {Math.round(perf)}%
                      </p>
                      <p
                        className="text-sm font-medium"
                        style={{ color: getColor(d.y, d.x) }}
                      >
                        Status: {estado}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter
              data={data}
              fill="#8884d8"
              onMouseEnter={(d) => setHoveredPoint(d.id)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              {data.map((entry, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={
                    hoveredPoint === entry.id
                      ? "#1e40af"
                      : getColor(entry.y, entry.x)
                  }
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
