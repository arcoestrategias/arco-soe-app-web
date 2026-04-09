"use client";

import React, { useState, useMemo } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { ResponsibilityType } from "../types/deployment-matrix";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  useDeploymentMatrix,
  useCollaborations,
} from "../hooks/use-deployment-matrix";
import {
  ModalObjectiveDeployment,
  type DeploymentModalData,
} from "./modal-objective-deployment";
import { usePermissions } from "@/shared/auth/access-control";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";

type DeploymentMatrixProps = {
  planId?: string;
  positionId?: string;
  year?: number | string;
};

const MATRIX_STATES: Record<
  ResponsibilityType,
  { label: string; dotClass: string; letter: string }
> = {
  [ResponsibilityType.IMPUTABLE]: {
    label: "Responsable Imputable",
    dotClass:
      "bg-gradient-to-br from-[var(--soe-grad-from)] to-[var(--soe-grad-to)] text-white shadow-md border-0",
    letter: "I",
  },
  [ResponsibilityType.SUPPORT]: {
    label: "Soporte",
    dotClass:
      "bg-[#ffa466]/20 text-[#f25c4c] shadow-sm border-2 border-[#f25c4c]/40",
    letter: "S",
  },
  [ResponsibilityType.INFORMED]: {
    label: "Informado / Consultado",
    dotClass: "bg-white text-[#f25c4c] shadow-sm border-2 border-[#ffa466]/70",
    letter: "C",
  },
};

export function DeploymentMatrix({
  planId,
  positionId,
  year,
}: DeploymentMatrixProps) {
  // Estado para el hover en cruz (resalta fila y columna)
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  const [modalData, setModalData] = useState<DeploymentModalData | null>(null);

  const permissions = usePermissions({
    update: PERMISSIONS.OBJECTIVES.UPDATE,
  });

  // Consumo del Endpoint
  const { data, isLoading, isError } = useDeploymentMatrix(planId, positionId, year);
  const { data: colabs, isLoading: isColabsLoading } = useCollaborations(
    planId,
    positionId,
    year
  );

  const sortedPositions = useMemo(() => {
    if (!data?.positions) return [];
    const myPos = data.positions.find((p) => p.id === data.positionId);
    const others = data.positions.filter((p) => p.id !== data.positionId);
    return myPos ? [myPos, ...others] : data.positions;
  }, [data]);

  return (
    <Card className="w-full border-0 shadow-none bg-transparent">
      {/* --- Header de la sección y Leyenda --- */}
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between py-4 px-0 border-b border-slate-200 mb-4 gap-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Matriz de Despliegue
        </h2>

        {/* Leyenda de Badges */}
        <div className="flex flex-wrap items-center gap-5">
          {Object.entries(MATRIX_STATES).map(([key, state]) => (
            <div
              key={key}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 select-none"
            >
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${state.dotClass}`}
              >
                {state.letter}
              </span>
              {state.label}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-8">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Cargando matriz de responsabilidades...</p>
          </div>
        )}

        {isError && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600 text-center">
            Ocurrió un error al cargar la información.
          </div>
        )}

        {!isLoading && !isError && data && (
          <>
            {/* --- Tabla (Matriz) --- */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-visible">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  {/* Header de la Tabla */}
                  <thead className="bg-muted/40 border-b border-slate-200">
                    <tr>
                      <th className="p-4 font-semibold text-slate-700 border-r border-slate-200 w-[35%] text-sm">
                        Objetivos
                      </th>
                      {sortedPositions.map((pos, i) => {
                        // Resaltar la columna del usuario logueado
                        const isMyColumn = pos.id === data.positionId;
                        return (
                          <th
                            key={pos.id}
                            className={`p-4 font-semibold text-center border-r border-slate-200 last:border-0 w-40 text-sm leading-tight ${
                              isMyColumn
                                ? "text-[#f25c4c] bg-[#ffa466]/10"
                                : "text-slate-700"
                            }`}
                          >
                            {pos.name}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  {/* Cuerpo de la Tabla */}
                  <tbody
                    onMouseLeave={() => {
                      setHoveredRow(null);
                      setHoveredCol(null);
                    }}
                  >
                    {data.objectives.map((objective, rIdx) => {
                      const isMyRow = objective.isMine;
                      const isOutOfRange = objective.isOutOfRange;
                      return (
                        <tr
                          key={objective.id}
                          className={`border-b border-slate-100 last:border-0 transition-colors duration-150 group/row ${
                            isOutOfRange ? "bg-red-50/40" : ""
                          }`}
                        >
                          {/* Celda del Objetivo */}
                          <td
                            className={`p-4 text-sm transition-colors duration-150 border-r border-slate-200 ${
                              hoveredRow === rIdx
                                ? isOutOfRange ? "bg-red-50" : "bg-slate-50"
                                : isMyRow
                                  ? "bg-[#ffa466]/10"
                                  : isOutOfRange
                                    ? "bg-red-50/20"
                                    : "bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isMyRow && (
                                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[var(--soe-grad-from)] to-[var(--soe-grad-to)] shrink-0 shadow-sm" />
                              )}
                              <span
                                className={
                                  isOutOfRange
                                    ? "font-medium text-slate-500"
                                    : isMyRow
                                      ? "font-bold text-slate-900"
                                      : "font-medium text-slate-800"
                                }
                              >
                                {objective.name}
                              </span>
                              {isOutOfRange && (
                                <div className="group/tooltip relative flex items-center justify-center">
                                  <AlertTriangle className="w-4 h-4 text-red-500 cursor-help" />
                                  <div className="absolute bottom-[calc(100%+4px)] left-0 px-2.5 py-1.5 bg-slate-800 text-white text-[11px] font-medium rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-40 shadow-lg">
                                    {objective.outOfRangeMessage}
                                    <div className="absolute top-full left-2 border-4 border-transparent border-t-slate-800" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Celdas de Intersección */}
                          {sortedPositions.map((pos, cIdx) => {
                            // Buscar si esta posición tiene responsabilidad en este objetivo
                            const rels: any = objective.relations || [];
                            const relation = Array.isArray(rels)
                              ? rels.find((r: any) => r.positionId === pos.id)
                              : rels?.[pos.id];

                            // Defensa: capitalizar el type por si el backend lo envía en formato diferente
                            const typeKey = relation?.type
                              ? String(relation.type).toUpperCase()
                              : null;
                            const state = typeKey
                              ? MATRIX_STATES[typeKey as ResponsibilityType]
                              : null;

                            const isRowHovered = hoveredRow === rIdx;
                            const isColHovered = hoveredCol === cIdx;
                            const isCellHovered = isRowHovered && isColHovered;
                            const isMyColumn = pos.id === data.positionId;

                            // Color de fondo para lograr el efecto cruz
                            let tdBg = "bg-white";
                            if (isCellHovered) tdBg = "bg-slate-100/80";
                            else if (isRowHovered || isColHovered)
                              tdBg = "bg-slate-50/60";
                            else if (isMyRow || isMyColumn)
                              tdBg = "bg-[#ffa466]/10"; // Suave resaltado en cruz natural del user

                            return (
                              <td
                                key={pos.id}
                                onMouseEnter={() => {
                                  setHoveredRow(rIdx);
                                  setHoveredCol(cIdx);
                                }}
                                onClick={() => {
                                  if (!permissions.update) return;
                                  setModalData({
                                    objectiveId: objective.id,
                                    objectiveName: objective.name,
                                    positionId: pos.id,
                                    positionName: pos.name,
                                    relationId: relation?.relationId,
                                    currentType:
                                      typeKey as ResponsibilityType | null,
                                  });
                                }}
                                className={`p-4 text-center border-r border-slate-100 relative ${permissions.update ? "cursor-pointer" : "cursor-default"} group/cell transition-colors duration-150 ${tdBg}`}
                              >
                                {state ? (
                                  <>
                                    {/* Indicador circular animado con Letra */}
                                    <div
                                      className={`w-8 h-8 flex items-center justify-center rounded-full mx-auto text-sm font-bold transition-transform duration-300 group-hover/cell:scale-110 shadow-sm ${state.dotClass}`}
                                    >
                                      {state.letter}
                                    </div>

                                    {/* Tooltip puro con CSS que se muestra en hover */}
                                    <div className="absolute bottom-[calc(100%-2px)] left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-800 text-white text-[11px] font-medium rounded-md opacity-0 group-hover/cell:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-30 translate-y-1 group-hover/cell:translate-y-0 shadow-lg">
                                      {state.label}
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                                    </div>
                                  </>
                                ) : permissions.update ? (
                                  <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full transition-colors duration-200 group-hover/cell:bg-slate-200/60">
                                    <span className="text-slate-300 group-hover/cell:hidden">-</span>
                                    <span className="text-slate-500 hidden group-hover/cell:block text-lg font-medium leading-none">+</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-200">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* --- Colaboraciones (Objetivos de Otros) --- */}
        {!isColabsLoading && colabs && colabs.length > 0 && (
          <div className="mt-12 w-full">
            <h3 className="text-base font-semibold text-slate-900 mb-4 px-1">
              Mis Colaboraciones
            </h3>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/40 border-b border-slate-200">
                    <tr>
                      <th className="p-4 font-semibold text-slate-700 text-sm">
                        Objetivos
                      </th>
                      <th className="p-4 font-semibold text-slate-700 text-sm w-64">
                        Dueño (Imputable)
                      </th>
                      <th className="p-4 font-semibold text-slate-700 text-sm w-48 text-center">
                        Mi Rol
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {colabs.map((colab) => {
                      const state = MATRIX_STATES[colab.myRelation];
                      const isOutOfRange = colab.isOutOfRange;
                      return (
                        <tr
                          key={colab.id}
                          className={`transition-colors ${
                            isOutOfRange ? "bg-red-50/30 hover:bg-red-50/60" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="p-4 text-sm font-medium border-r border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className={isOutOfRange ? "text-slate-500" : "text-slate-800"}>
                                {colab.name}
                              </span>
                              {isOutOfRange && (
                                <div className="group/tooltip relative flex items-center justify-center">
                                  <AlertTriangle className="w-4 h-4 text-red-500 cursor-help" />
                                  <div className="absolute bottom-[calc(100%+4px)] left-0 px-2.5 py-1.5 bg-slate-800 text-white text-[11px] font-medium rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-40 shadow-lg">
                                    {colab.outOfRangeMessage}
                                    <div className="absolute top-full left-2 border-4 border-transparent border-t-slate-800" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className={`p-4 text-sm border-r border-slate-100 ${isOutOfRange ? "text-slate-400" : "text-slate-600"}`}>
                            {colab.ownerPosition.name}
                          </td>
                          <td className="p-4 text-center relative cursor-pointer group/cell">
                            {state ? (
                              <>
                                <div
                                  className={`mx-auto flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-transform duration-300 group-hover/cell:scale-110 shadow-sm ${state.dotClass}`}
                                >
                                  {state.letter}
                                </div>
                                {/* Tooltip estilo Matriz */}
                                <div className="absolute bottom-[calc(100%-2px)] left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-800 text-white text-[11px] font-medium rounded-md opacity-0 group-hover/cell:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-30 translate-y-1 group-hover/cell:translate-y-0 shadow-lg">
                                  {state.label}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                                </div>
                              </>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <ModalObjectiveDeployment
        open={!!modalData}
        onClose={() => setModalData(null)}
        data={modalData}
      />
    </Card>
  );
}
