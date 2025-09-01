"use client";

import { Handle, Position } from "@xyflow/react";
import { TooltipTexto } from "./tooltip-texto";

interface StrategyMapNodeProps {
  data: {
    nombre: string;
    estado: "cumplido" | "en-proceso" | "no-cumplido";
    perspectiva: string;
  };
}

export function StrategyMapNode({ data }: StrategyMapNodeProps) {
  const getColorByEstado = (estado: string) => {
    switch (estado) {
      case "cumplido":
        return "bg-green-100 border-green-300 text-green-800";
      case "en-proceso":
        return "bg-yellow-100 border-yellow-300 text-yellow-800";
      case "no-cumplido":
        return "bg-red-100 border-red-300 text-red-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const displayNombre =
    data.nombre.length > 42 ? `${data.nombre.slice(0, 39)}...` : data.nombre;

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 shadow-sm transition-all duration-200
        hover:shadow-md hover:scale-105 cursor-pointer w-[200px] h-[80px]
        ${getColorByEstado(data.estado)}
      `}
    >
      <Handle
        type="source"
        position={Position.Top}
        className="w-2 h-2 bg-gray-400 border-white"
      />

      <div className="flex items-center justify-center h-full">
        <TooltipTexto texto={data.nombre}>
          <div className="text-sm font-medium leading-tight overflow-hidden text-center">
            {displayNombre}
          </div>
        </TooltipTexto>
      </div>

      <Handle
        type="target"
        position={Position.Bottom}
        className="w-2 h-2 bg-gray-400 border-white"
      />
    </div>
  );
}
