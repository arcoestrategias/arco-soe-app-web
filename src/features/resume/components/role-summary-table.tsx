"use client";

import * as React from "react";
import type { PositionOverviewItem } from "../types/positions-overview";
import { Card } from "@/components/ui/card";

type RoleSummaryTableProps = {
  positions: PositionOverviewItem[]; // 👈 ahora viene del endpoint
  hoveredId?: string | null;
  onHoverIdChange?: (id: string | null) => void;
};

const badgeWhite =
  "inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium min-w-[45px] bg-white text-gray-900 border border-gray-200";

export default function RoleSummaryTable({
  positions,
  hoveredId,
  onHoverIdChange,
}: RoleSummaryTableProps) {
  return (
    <Card>
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          Resumen por Posición
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left">
                <th className="p-3 font-semibold text-gray-700 w-[280px]">
                  Posición
                </th>
                <th className="p-3 font-semibold text-gray-700 text-center">
                  Prioridades
                </th>
                <th className="p-3 font-semibold text-gray-700 text-center">
                  Objetivos
                </th>
                <th className="p-3 font-semibold text-gray-700 text-center">
                  Proyectos
                </th>
                <th className="p-3 font-semibold text-gray-700 text-center">
                  ICO (mes)
                </th>
                <th className="p-3 font-semibold text-gray-700 text-center">
                  ICP (mes)
                </th>
                <th className="p-3 font-semibold text-gray-700 text-center">
                  Performance (mes)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {positions.map((p) => {
                const isHovered = hoveredId === p.idPosition;
                return (
                  <tr
                    key={p.idPosition}
                    className={
                      isHovered ? "bg-orange-50/60" : "hover:bg-gray-50/50"
                    }
                    onMouseEnter={() => onHoverIdChange?.(p.idPosition)}
                    onMouseLeave={() => onHoverIdChange?.(null)}
                  >
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {p.namePosition}
                        </span>
                        <span className="text-xs text-gray-500">
                          {p.nameUser}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-center">{p.numPriorities}</td>
                    <td className="p-3 text-center">{p.numObjectives}</td>
                    <td className="p-3 text-center">{p.numProjects}</td>
                    <td className="p-3 text-center">
                      <span className={badgeWhite}>{p.ico}%</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={badgeWhite}>{p.icp}%</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={badgeWhite}>{p.performance}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
