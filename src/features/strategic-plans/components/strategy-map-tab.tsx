"use client";

import { useStrategyMap } from "@/features/strategic-plans/hooks/useStrategyMap";
import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { StrategyMapNode } from "./strategy-map-node";
import type { StrategyMapObjective } from "@/features/strategic-plans/types/strategy-map";

// Tipos internos del componente, ahora en inglés
type MappedPerspective = "financiera" | "cliente" | "procesos" | "persona";

interface MappedObjective {
  id: string;
  nombre: string;
  estado: "cumplido" | "en-proceso" | "no-cumplido" | "no-se-mide";
  perspectiva: MappedPerspective;
  padreId: string | null;
}

type Props = {
  strategicPlanId?: string;
};

// --- Funciones de Mapeo ---

const mapPerspective = (
  p: StrategyMapObjective["perspective"]
): MappedPerspective => {
  const mapping: Record<
    StrategyMapObjective["perspective"],
    MappedPerspective
  > = {
    FIN: "financiera",
    CLI: "cliente",
    PRO: "procesos",
    PER: "persona",
  };
  return mapping[p];
};

const mapStatus = (
  objective: StrategyMapObjective
): MappedObjective["estado"] => {
  // La API devuelve un solo elemento en icoMonthly con la data relevante.
  const currentMonthData = objective.icoMonthly[0];

  // Si no hay data del mes o si explícitamente no se mide, el estado es 'anulado'.
  if (!currentMonthData || !currentMonthData.isMeasured) {
    return "no-se-mide";
  }

  // Mapeamos el 'semáforo' numérico al estado correspondiente.
  const statusMap: Record<number, MappedObjective["estado"]> = {
    1: "cumplido",
    2: "en-proceso",
    3: "no-cumplido",
  };

  // Si lightNumeric es null, también se considera 'anulado'.
  return currentMonthData.lightNumeric !== null
    ? statusMap[currentMonthData.lightNumeric]
    : "no-se-mide";
};

// --- Componente Principal ---

export function StrategyMapTab({ strategicPlanId }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { data: objectivesFromApi, isLoading } =
    useStrategyMap(strategicPlanId);

  const perspectivas = [
    { id: "pers-fin", nombre: "FINANCIERA", y: 120, color: "text-blue-700" },
    { id: "pers-cli", nombre: "CLIENTE", y: 350, color: "text-green-700" },
    { id: "pers-pro", nombre: "PROCESOS", y: 580, color: "text-orange-700" },
    { id: "pers-per", nombre: "PERSONA", y: 810, color: "text-purple-700" },
  ];

  const perspectiveY: Record<MappedPerspective, number> = {
    financiera: 120,
    cliente: 350,
    procesos: 580,
    persona: 810,
  };

  const perspectiveOrder: Record<MappedPerspective, number> = {
    persona: 1,
    procesos: 2,
    cliente: 3,
    financiera: 4,
  };

  const CARD_WIDTH = 200;
  const CARD_SPACING = 50;
  const TOTAL_CARD_SPACE = CARD_WIDTH + CARD_SPACING;
  const START_X = 120;

  const getPosition = (index: number, perspectiva: MappedPerspective) => ({
    x: START_X + index * TOTAL_CARD_SPACE,
    y: perspectiveY[perspectiva],
  });

  // const objetivos: ObjetivoEstrategico[] = [
  //   // PERSONA
  //   {
  //     id: "uuid-pe1",
  //     nombre: "Desarrollar liderazgo",
  //     estado: "en-proceso",
  //     perspectiva: "persona",
  //   },
  //   {
  //     id: "uuid-pe2",
  //     nombre: "Mejorar clima laboral",
  //     estado: "cumplido",
  //     perspectiva: "persona",
  //     padreId: "uuid-pe1",
  //   },
  //   {
  //     id: "uuid-pe3",
  //     nombre: "Programa de bienestar",
  //     estado: "no-cumplido",
  //     perspectiva: "persona",
  //   },
  //   {
  //     id: "uuid-pe4",
  //     nombre: "Fomentar innovación",
  //     estado: "en-proceso",
  //     perspectiva: "persona",
  //   },
  //   {
  //     id: "uuid-pe5",
  //     nombre: "Capacitación digital",
  //     estado: "cumplido",
  //     perspectiva: "persona",
  //   },
  //   {
  //     id: "uuid-pe6",
  //     nombre: "Retención de talento",
  //     estado: "en-proceso",
  //     perspectiva: "persona",
  //   },
  //   {
  //     id: "uuid-pe7",
  //     nombre: "Liderazgo femenino",
  //     estado: "en-proceso",
  //     perspectiva: "persona",
  //   },
  //   {
  //     id: "uuid-pe8",
  //     nombre: "Evaluar desempeño",
  //     estado: "cumplido",
  //     perspectiva: "persona",
  //   },
  //   {
  //     id: "uuid-pe9",
  //     nombre: "Trabajo colaborativo",
  //     estado: "cumplido",
  //     perspectiva: "persona",
  //     padreId: "uuid-pe4",
  //   },
  //   {
  //     id: "uuid-pe10",
  //     nombre: "Marca empleadora",
  //     estado: "en-proceso",
  //     perspectiva: "persona",
  //   },

  //   // PROCESOS
  //   {
  //     id: "uuid-pr1",
  //     nombre: "Optimizar procesos",
  //     estado: "cumplido",
  //     perspectiva: "procesos",
  //     padreId: "uuid-pe5",
  //   },
  //   {
  //     id: "uuid-pr2",
  //     nombre: "Automatizar tareas",
  //     estado: "en-proceso",
  //     perspectiva: "procesos",
  //     padreId: "uuid-pr1",
  //   },
  //   {
  //     id: "uuid-pr3",
  //     nombre: "Reducir tiempos",
  //     estado: "en-proceso",
  //     perspectiva: "procesos",
  //   },
  //   {
  //     id: "uuid-pr4",
  //     nombre: "Mejorar trazabilidad",
  //     estado: "no-cumplido",
  //     perspectiva: "procesos",
  //   },
  //   {
  //     id: "uuid-pr5",
  //     nombre: "Control de calidad",
  //     estado: "cumplido",
  //     perspectiva: "procesos",
  //   },
  //   {
  //     id: "uuid-pr6",
  //     nombre: "Digitalizar formularios",
  //     estado: "cumplido",
  //     perspectiva: "procesos",
  //   },
  //   {
  //     id: "uuid-pr7",
  //     nombre: "Reducir errores",
  //     estado: "en-proceso",
  //     perspectiva: "procesos",
  //     padreId: "uuid-pr6",
  //   },
  //   {
  //     id: "uuid-pr8",
  //     nombre: "Eficiencia logística",
  //     estado: "en-proceso",
  //     perspectiva: "procesos",
  //   },
  //   {
  //     id: "uuid-pr9",
  //     nombre: "Cadena de suministro",
  //     estado: "no-cumplido",
  //     perspectiva: "procesos",
  //   },
  //   {
  //     id: "uuid-pr10",
  //     nombre: "Gestión documental",
  //     estado: "cumplido",
  //     perspectiva: "procesos",
  //   },

  //   // CLIENTE
  //   {
  //     id: "uuid-cl1",
  //     nombre: "Satisfacción del cliente",
  //     estado: "cumplido",
  //     perspectiva: "cliente",
  //     padreId: "uuid-pr3",
  //   },
  //   {
  //     id: "uuid-cl2",
  //     nombre: "Retención de clientes",
  //     estado: "en-proceso",
  //     perspectiva: "cliente",
  //     padreId: "uuid-cl1",
  //   },
  //   {
  //     id: "uuid-cl3",
  //     nombre: "Personalizar experiencia",
  //     estado: "en-proceso",
  //     perspectiva: "cliente",
  //   },
  //   {
  //     id: "uuid-cl4",
  //     nombre: "Canales de atención",
  //     estado: "no-cumplido",
  //     perspectiva: "cliente",
  //   },
  //   {
  //     id: "uuid-cl5",
  //     nombre: "Expandir clientes",
  //     estado: "cumplido",
  //     perspectiva: "cliente",
  //     padreId: "uuid-cl2",
  //   },
  //   {
  //     id: "uuid-cl6",
  //     nombre: "Reducir abandono",
  //     estado: "cumplido",
  //     perspectiva: "cliente",
  //   },
  //   {
  //     id: "uuid-cl7",
  //     nombre: "Propuesta de valor",
  //     estado: "en-proceso",
  //     perspectiva: "cliente",
  //   },
  //   {
  //     id: "uuid-cl8",
  //     nombre: "Experiencia digital",
  //     estado: "en-proceso",
  //     perspectiva: "cliente",
  //   },
  //   {
  //     id: "uuid-cl9",
  //     nombre: "Encuesta NPS",
  //     estado: "no-cumplido",
  //     perspectiva: "cliente",
  //   },
  //   {
  //     id: "uuid-cl10",
  //     nombre: "Fidelizar clientes",
  //     estado: "en-proceso",
  //     perspectiva: "cliente",
  //     padreId: "uuid-cl6",
  //   },

  //   // FINANCIERA
  //   {
  //     id: "uuid-fi1",
  //     nombre: "Ingresos sostenibles",
  //     estado: "en-proceso",
  //     perspectiva: "financiera",
  //     padreId: "uuid-cl5",
  //   },
  //   {
  //     id: "uuid-fi2",
  //     nombre: "Reducir costos",
  //     estado: "cumplido",
  //     perspectiva: "financiera",
  //     padreId: "uuid-pr2",
  //   },
  //   {
  //     id: "uuid-fi3",
  //     nombre: "Margen operativo",
  //     estado: "no-cumplido",
  //     perspectiva: "financiera",
  //     padreId: "uuid-fi2",
  //   },
  //   {
  //     id: "uuid-fi4",
  //     nombre: "Fuentes de ingreso",
  //     estado: "cumplido",
  //     perspectiva: "financiera",
  //     padreId: "uuid-cl5",
  //   },
  //   {
  //     id: "uuid-fi5",
  //     nombre: "Rentabilidad por cliente",
  //     estado: "en-proceso",
  //     perspectiva: "financiera",
  //     padreId: "uuid-cl3",
  //   },
  //   {
  //     id: "uuid-fi6",
  //     nombre: "Aumentar liquidez",
  //     estado: "cumplido",
  //     perspectiva: "financiera",
  //   },
  //   {
  //     id: "uuid-fi7",
  //     nombre: "Gastos financieros",
  //     estado: "en-proceso",
  //     perspectiva: "financiera",
  //   },
  //   {
  //     id: "uuid-fi8",
  //     nombre: "Optimizar inversiones",
  //     estado: "cumplido",
  //     perspectiva: "financiera",
  //     padreId: "uuid-fi1",
  //   },
  //   {
  //     id: "uuid-fi9",
  //     nombre: "Flujo de caja",
  //     estado: "en-proceso",
  //     perspectiva: "financiera",
  //     padreId: "uuid-pr9",
  //   },
  //   {
  //     id: "uuid-fi10",
  //     nombre: "Productividad financiera",
  //     estado: "cumplido",
  //     perspectiva: "financiera",
  //   },
  // ];

  //   perspectiva: "financiera",
  const nodeTypes = {
    objetivo: StrategyMapNode,
    perspectiva: ({ data }: any) => (
      <div
        className="bg-white/80 border-2 border-dashed border-gray-300 rounded-xl p-4"
        style={{ width: data.width, height: data.height }}
      >
        <h3 className={`text-lg font-bold ${data.color} text-left`}>
          {data.nombre}
        </h3>
      </div>
    ),
  };

  const getPerspectiveWidth = (objetivosCount: number) =>
    Math.max(1800, TOTAL_CARD_SPACE * objetivosCount + 100);

  useEffect(() => {
    if (!objectivesFromApi) return;

    // 1. Mapear datos de la API a la estructura del componente
    const mappedObjectives: MappedObjective[] = objectivesFromApi.map((o) => ({
      id: o.id,
      nombre: o.name,
      perspectiva: mapPerspective(o.perspective),
      padreId: o.objectiveParentId,
      estado: mapStatus(o),
    }));

    // 2. Agrupar por perspectiva
    const groupedByPerspective: Record<MappedPerspective, MappedObjective[]> = {
      financiera: mappedObjectives.filter(
        (o) => o.perspectiva === "financiera"
      ),
      cliente: mappedObjectives.filter((o) => o.perspectiva === "cliente"),
      procesos: mappedObjectives.filter((o) => o.perspectiva === "procesos"),
      persona: mappedObjectives.filter((o) => o.perspectiva === "persona"),
    };

    // 3. Crear nodos de perspectiva
    const perspectivaNodes: Node[] = perspectivas.map((p) => {
      return {
        id: p.id,
        type: "perspectiva",
        position: { x: 50, y: p.y - 70 },
        data: {
          nombre: p.nombre,
          color: p.color,
          width: getPerspectiveWidth(
            Math.max(
              ...Object.values(groupedByPerspective).map(
                (lista) => lista.length
              )
            )
          ),
          height: 180,
        },
        draggable: false,
        selectable: false,
        zIndex: -1,
      };
    });

    // 4. Crear nodos de objetivo
    const objetivoNodes: Node[] = Object.entries(groupedByPerspective).flatMap(
      ([perspectiva, lista]) =>
        lista.map((o, index) => ({
          id: o.id,
          type: "objetivo",
          position: getPosition(index, perspectiva as MappedPerspective),
          data: {
            nombre: o.nombre,
            estado: o.estado,
            perspectiva: o.perspectiva,
          },
          draggable: false,
          selectable: false,
          zIndex: 10,
        }))
    );

    // 5. Crear las conexiones (edges)
    const edgeList: Edge[] = mappedObjectives
      .filter((o) => o.padreId)
      .map((o) => {
        const parent = mappedObjectives.find((p) => p.id === o.padreId);
        if (!parent) return null;

        const sourceLevel = perspectiveOrder[parent.perspectiva];
        const targetLevel = perspectiveOrder[o.perspectiva];

        if (sourceLevel > targetLevel) return null;

        const isInternal = parent.perspectiva === o.perspectiva;
        const isSelected = parent.id === selectedNodeId;

        return {
          id: `edge-${parent.id}-${o.id}`,
          source: parent.id,
          target: o.id,
          type: "smoothstep",
          animated: isSelected,
          style: {
            strokeDasharray: "6,4",
            strokeWidth: isSelected ? 3 : isInternal ? 1.5 : 2,
            stroke: isSelected ? "#3b82f6" : isInternal ? "#9333ea" : "#64748b",
            strokeLinecap: "round",
            filter: isSelected
              ? "drop-shadow(0 2px 4px rgba(59, 130, 246, 0.5))"
              : "none",
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isSelected ? "#3b82f6" : isInternal ? "#9333ea" : "#64748b",
            width: isSelected ? 24 : isInternal ? 16 : 20,
            height: isSelected ? 24 : isInternal ? 16 : 20,
          },
          data: {},
          zIndex: 5,
        };
      })
      .filter(Boolean) as Edge[];

    setNodes([...perspectivaNodes, ...objetivoNodes]);
    setEdges(edgeList);
  }, [selectedNodeId, objectivesFromApi]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.stopPropagation();
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  if (isLoading) {
    return (
      <div className="h-[900px] w-full flex items-center justify-center bg-gray-50 rounded-lg border">
        <p className="text-gray-500">Cargando mapa estratégico...</p>
      </div>
    );
  }

  return (
    <div className="h-[900px] w-full relative bg-gray-50 rounded-lg border border-gray-200">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        nodesDraggable={false}
        elementsSelectable={false}
      >
        <Background color="#e2e8f0" gap={25} />
        <Controls position="top-left" />
        {/* <MiniMap position="top-right" /> */}
      </ReactFlow>
      <div className="absolute bottom-4 right-4 bg-white rounded-lg border border-gray-300 p-4 shadow-md text-sm flex gap-6">
        <div className="space-y-2">
          <div className="font-semibold">Estados</div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-500 rounded" />
            <span>Cumplido</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-500 rounded" />
            <span>En Proceso</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-500 rounded" />
            <span>No Cumplido</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-semibold">Conexiones</div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-[#64748b] rounded" />
            <span>Externa</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-[#9333ea] rounded" />
            <span>Interna</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-[#3b82f6] rounded" />
            <span>Seleccionado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
