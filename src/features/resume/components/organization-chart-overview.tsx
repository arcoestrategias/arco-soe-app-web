"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useOrgChartOverview } from "../hooks/use-org-chart-overview";
import type { OrgChartNodeDTO } from "../types/org-chart-overview";
import { PositionCard } from "./position-card";
import { Skeleton } from "@/components/ui/skeleton";

type OrgNode = OrgChartNodeDTO & { nivel: number; expandido: boolean };

type NodeBox = {
  id: string;
  node: OrgNode;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  hasChildren: boolean;
};

type Edge = {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  visible: boolean;
};

const NODE_W = 280;
const NODE_H = 160;
const LEVEL_VSPACE = 300;
const MIN_HSPACE = 120;

/** Un nodo es visible si:
 *  - depth <= 1 (root y nivel 1 SIEMPRE visibles), o
 *  - su PADRE está expandido (parentExpanded = true) y sus ancestros son visibles.
 *  El flag expandido del nodo controla SOLO si se muestran SUS hijos.
 */
function layoutTree(root: OrgNode) {
  const nodes: NodeBox[] = [];
  const edges: Edge[] = [];

  const place = (
    n: OrgNode,
    depth: number,
    ancestorsVisible: boolean,
    parentExpanded: boolean,
    x: number,
    y: number
  ) => {
    const meVisible = ancestorsVisible && (depth <= 1 || parentExpanded);
    const hasChildren = !!n.children?.length;

    if (meVisible) {
      nodes.push({
        id: n.idPosition,
        node: n,
        x,
        y,
        width: NODE_W,
        height: NODE_H,
        visible: true,
        hasChildren,
      });
    }

    // Si yo no soy visible, no sigo
    if (!meVisible) return;

    // Para mostrar hijos, NECESITO que yo (n) esté expandido
    if (!hasChildren || !n.expandido) return;

    // ----- medir anchos de subárbol visible (dado que este padre está expandido) -----
    const childWidths = (n.children as OrgNode[]).map((c) =>
      measure(c, depth + 1, meVisible, /* parentExpanded */ n.expandido)
    );
    const totalW =
      childWidths.reduce((a, b) => a + b, 0) +
      (childWidths.length - 1) * MIN_HSPACE;

    // primer hijo centrado
    let cx = x - totalW / 2 + childWidths[0] / 2;

    (n.children as OrgNode[]).forEach((c, i) => {
      c.nivel = depth + 1;
      // hijo es visible si (depth+1)<=1 (no) o si parentExpanded (n.expandido) -> sí cuando expandes el padre
      const childVisible = meVisible && (depth + 1 <= 1 || n.expandido);

      if (childVisible) {
        edges.push({
          id: `${n.idPosition}-${c.idPosition}`,
          sourceX: x,
          sourceY: y + NODE_H,
          targetX: cx,
          targetY: y + LEVEL_VSPACE,
          visible: true,
        });
      }

      // Coloca hijo (su visibilidad la rehace internamente)
      place(
        c,
        depth + 1,
        meVisible,
        /* parentExpanded */ n.expandido,
        cx,
        y + LEVEL_VSPACE
      );

      if (i < childWidths.length - 1) {
        cx += childWidths[i] / 2 + MIN_HSPACE + childWidths[i + 1] / 2;
      }
    });
  };

  // mide ancho del subárbol VISIBLE bajo las mismas reglas
  const measure = (
    n: OrgNode,
    depth: number,
    ancestorsVisible: boolean,
    parentExpanded: boolean
  ): number => {
    const meVisible = ancestorsVisible && (depth <= 1 || parentExpanded);
    const hasChildren = !!n.children?.length;

    if (!hasChildren || !n.expandido || !meVisible) return NODE_W;

    const widths = (n.children as OrgNode[]).map((c) =>
      measure(c, depth + 1, meVisible, /* parentExpanded */ n.expandido)
    );
    const sum = widths.reduce((a, b) => a + b, 0);
    const gaps = (widths.length - 1) * MIN_HSPACE;
    return Math.max(NODE_W, sum + gaps);
  };

  place(root, 0, true, /* parentExpanded */ true, 0, 0);
  return { nodes, edges };
}

function Controls({
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
  onToggleAll,
  allExpanded,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onToggleAll: () => void;
  allExpanded: boolean;
}) {
  return (
    <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg border p-2 flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onZoomIn}
        disabled={zoom >= 2}
      >
        +
      </Button>
      <div className="px-2 text-xs min-w-[50px] text-center">
        {Math.round(zoom * 100)}%
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={onZoomOut}
        disabled={zoom <= 0.3}
      >
        −
      </Button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <Button variant="outline" size="sm" onClick={onFit}>
        Ver todo
      </Button>
      <Button variant="outline" size="icon" onClick={onToggleAll}>
        {allExpanded ? (
          <ChevronDown className="h-4 w-4 rotate-180" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

export function OrganizationChartOverview({
  companyId,
  businessUnitId,
  strategicPlanId,
  year,
  month,
  positionId, // <— NUEVO
}: {
  companyId?: string;
  businessUnitId?: string;
  strategicPlanId?: string | null;
  year?: number | string;
  month?: number | string;
  positionId?: string | null;
}) {
  const { data, isLoading, isError } = useOrgChartOverview(
    companyId,
    businessUnitId,
    strategicPlanId ?? undefined,
    year,
    month,
    positionId ?? null
  );

  const payload: any = data;
  const apiRoot: OrgChartNodeDTO | undefined =
    payload?.root ?? payload?.data?.root;

  const [root, setRoot] = useState<OrgNode | null>(null);
  const [nodes, setNodes] = useState<NodeBox[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [allExpanded, setAllExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hidrata y colapsa: root expandido, nivel 1 NO expandido (visible igual), nietos ocultos
  useEffect(() => {
    if (!apiRoot) {
      setRoot(null);
      setNodes([]);
      setEdges([]);
      return;
    }
    const seed: OrgNode = { ...apiRoot, nivel: 0, expandido: true };
    const collapse = (n: OrgNode, d = 0): OrgNode => ({
      ...n,
      // Root expandido para mostrar nivel 1; nivel 1 por defecto NO expandido (oculta nietos)
      expandido: d === 0,
      children:
        n.children?.map((c) =>
          collapse({ ...(c as OrgNode), nivel: d + 1, expandido: false }, d + 1)
        ) ?? [],
    });
    setRoot(collapse(seed));
    setAllExpanded(false);
  }, [apiRoot]);

  // Layout + fit
  useEffect(() => {
    if (!root) return;
    const { nodes, edges } = layoutTree(root);
    setNodes(nodes);
    setEdges(edges);

    if (containerRef.current && nodes.length) {
      const rect = containerRef.current.getBoundingClientRect();
      const vis = nodes.filter((n) => n.visible);
      const minX = Math.min(...vis.map((n) => n.x - n.width / 2));
      const maxX = Math.max(...vis.map((n) => n.x + n.width / 2));
      const minY = Math.min(...vis.map((n) => n.y));
      const maxY = Math.max(...vis.map((n) => n.y + n.height));
      const contentW = maxX - minX + 200;
      const contentH = maxY - minY + 200;
      const scale = Math.min(rect.width / contentW, rect.height / contentH, 1);
      setZoom(scale);
      setPan({
        x: rect.width / 2 - ((minX + maxX) / 2) * scale,
        y: 80 - minY * scale,
      });
    }
  }, [root]);

  const toggleExpand = (id: string) => {
    if (!root) return;
    const dfs = (n: OrgNode): OrgNode => {
      if (n.idPosition === id) return { ...n, expandido: !n.expandido };
      return {
        ...n,
        children: n.children?.map((c) => dfs(c as OrgNode)) ?? [],
      };
    };
    setRoot((r) => (r ? dfs(r) : r));
  };

  const expandAll = () => {
    if (!root) return;
    const dfs = (n: OrgNode): OrgNode => ({
      ...n,
      expandido: true,
      children: n.children?.map((c) => dfs(c as OrgNode)) ?? [],
    });
    setRoot((r) => (r ? dfs(r) : r));
    setAllExpanded(true);
  };

  const collapseDefault = () => {
    if (!root) return;
    // Root expandido; nivel 1 NO expandido
    const dfs = (n: OrgNode, d = 0): OrgNode => ({
      ...n,
      expandido: d === 0,
      children: n.children?.map((c) => dfs(c as OrgNode, d + 1)) ?? [],
    });
    setRoot((r) => (r ? dfs(r) : r));
    setAllExpanded(false);
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.3, Math.min(2, z + (e.deltaY > 0 ? -0.1 : 0.1))));
  };
  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const onMouseUp = () => setDragging(false);

  if (isLoading) {
    return (
      <div className="relative w-full h-[calc(100vh-200px)] bg-gray-50 rounded-lg border p-6">
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    );
  }
  if (isError)
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-lg border border-red-200">
        Error cargando organigrama.
      </div>
    );
  if (!root)
    return (
      <div className="p-6 text-sm text-gray-500">Sin datos para mostrar.</div>
    );

  return (
    <div className="relative w-full h-[calc(100vh-200px)] bg-gray-50 rounded-lg border overflow-hidden">
      <div className="absolute top-4 right-4 z-10">
        <Controls
          zoom={zoom}
          onZoomIn={() => setZoom((z) => Math.min(2, z + 0.1))}
          onZoomOut={() => setZoom((z) => Math.max(0.3, z - 0.1))}
          onFit={() => setRoot((r) => (r ? { ...r } : r))}
          onToggleAll={allExpanded ? collapseDefault : expandAll}
          allExpanded={allExpanded}
        />
      </div>

      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        <div
          className="relative"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            transition: dragging ? "none" : "transform 0.2s ease-out",
            width: "100%",
            height: "100%",
          }}
        >
          {/* edges */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: "100%", height: "100%", overflow: "visible" }}
          >
            {edges.map((e) => (
              <line
                key={e.id}
                x1={e.sourceX}
                y1={e.sourceY}
                x2={e.targetX}
                y2={e.targetY}
                stroke="#9ca3af"
                strokeWidth="2"
                strokeDasharray="6,4"
                strokeLinecap="round"
              />
            ))}
          </svg>

          {/* nodes */}
          {nodes.map((b) => (
            <div
              key={b.id}
              className="absolute"
              style={{
                left: b.x - b.width / 2,
                top: b.y,
                width: b.width,
                height: b.height,
              }}
            >
              <div className="relative">
                <PositionCard node={b.node} />
                {b.hasChildren && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(b.id);
                    }}
                  >
                    {b.node.expandido ? (
                      <ChevronDown className="h-3 w-3 text-gray-600" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-gray-600" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
