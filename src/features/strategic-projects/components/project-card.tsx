"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckSquare, FileText, Settings, Target } from "lucide-react";
import { formatCurrency, formatDate } from "@/shared/utils";
import { TextWithTooltip } from "@/components/ui/text-with-tooltip";

interface ProjectCardProps {
  id: number;
  iniciales: string;
  color: string;
  titulo: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  cumplimiento: number;
  metaEstrategica: string;
  presupuestoProyecto: number;
  presupuestoReal: number;
  totalTareas: number;
  tareasCompletadas: number;
  factoresClave: number;
  animatedProgress: number;
  onOpenModal: (
    type: "factors" | "tasks",
    projectId: number,
    projectName: string
  ) => void;
}

export function ProjectCard({
  id,
  iniciales,
  color,
  titulo,
  descripcion,
  fechaInicio,
  fechaFin,
  cumplimiento,
  metaEstrategica,
  presupuestoProyecto,
  presupuestoReal,
  totalTareas,
  tareasCompletadas,
  factoresClave,
  animatedProgress,
  onOpenModal,
}: ProjectCardProps) {
  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl bg-white overflow-hidden flex flex-col">
      <CardContent className="pt-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center shadow-sm flex-shrink-0`}
          >
            <span className="text-white font-bold text-lg">{iniciales}</span>
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <TextWithTooltip
              text={titulo}
              lines={1}
              className="text-sm font-semibold text-gray-900"
            />
            <TextWithTooltip
              text={descripcion}
              lines={2}
              className="text-xs text-gray-600"
            />
          </div>
        </div>

        {/* Progreso */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600 font-semibold">
              Cumplimiento
            </span>
            <span className="text-sm font-semibold text-green-600">
              {cumplimiento}%
            </span>
          </div>
          <Progress
            value={animatedProgress}
            className="h-2 [&>div]:bg-green-500 [&>div]:transition-all [&>div]:duration-1000 [&>div]:ease-out"
          />
        </div>

        {/* Fechas */}
        <div className="flex items-center space-x-3 mb-4">
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-700 text-xs"
          >
            {formatDate(fechaInicio)}
          </Badge>
          <Badge
            variant="secondary"
            className="bg-red-100 text-red-700 text-xs"
          >
            {formatDate(fechaFin)}
          </Badge>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-50 p-2 rounded-lg text-center">
            <p className="text-[10px] text-gray-500">Presupuesto</p>
            <p className="text-xs font-medium text-gray-900">
              {formatCurrency(presupuestoProyecto)}
            </p>
          </div>
          <div className="bg-gray-50 p-2 rounded-lg text-center">
            <p className="text-[10px] text-gray-500">Ejecutado</p>
            <p className="text-xs font-medium text-gray-900">
              {formatCurrency(presupuestoReal)}
            </p>
          </div>
          <div className="bg-gray-50 p-2 rounded-lg text-center">
            <p className="text-[10px] text-gray-500">Tareas</p>
            <p className="text-xs font-medium text-gray-900">
              {tareasCompletadas}/{totalTareas}
            </p>
          </div>
        </div>

        {/* Meta estratégica */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium text-blue-600">
              Meta estratégica
            </span>
          </div>
          <TextWithTooltip
            text={metaEstrategica}
            lines={2}
            className="text-xs text-gray-600"
          />
        </div>

        {/* Acciones */}
        <div className="flex justify-between gap-2 pt-4 border-t border-gray-100 mt-auto">
          <Badge
            className="bg-orange-100 text-orange-700 hover:bg-orange-200 text-[10px] flex-1 justify-center cursor-pointer"
            onClick={() => onOpenModal("factors", id, titulo)}
          >
            <Settings className="h-3 w-3 mr-1" />
            Factores ({factoresClave})
          </Badge>
          <Badge
            className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-[10px] flex-1 justify-center cursor-pointer"
            onClick={() => onOpenModal("tasks", id, titulo)}
          >
            <CheckSquare className="h-3 w-3 mr-1" />
            Tareas ({totalTareas})
          </Badge>
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-[10px] flex-1 justify-center">
            <FileText className="h-3 w-3 mr-1" />
            Reporte
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
