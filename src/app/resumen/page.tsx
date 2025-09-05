"use client";

import { useState } from "react";
import { SidebarLayout } from "@/shared/layout";
import { SectionHeader } from "@/shared/components";
import {
  VelocimeterICO,
  PerformanceMap,
  RoleSummaryTable,
} from "@/features/resumen/components";
import { getMockResumen, mapToScatterData } from "@/features/resumen/utils";

export default function ResumenPage() {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const { icoPromedio, topRoles, allRoles } = getMockResumen();
  const scatterData = mapToScatterData(allRoles);

  return (
    <SidebarLayout currentPath="/resumen" onNavigate={() => {}}>
      <div className="space-y-6 font-system">
        <SectionHeader
          title="SOE Executive Summary"
          description="Consolidated view of organizational performance and strategic goal compliance."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VelocimeterICO value={icoPromedio} title="Company ICO Average" />
          <PerformanceMap data={scatterData} />
        </div>

        <RoleSummaryTable
          roles={topRoles}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
        />
      </div>
    </SidebarLayout>
  );
}
