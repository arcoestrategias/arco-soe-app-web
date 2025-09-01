"use client";

import * as React from "react";
import { useState } from "react";
import { SidebarLayout } from "@/shared/layout";
import { StrategicPlanSelect } from "@/shared/filters/components/StrategicPlanSelect";
import { getBusinessUnitId } from "@/shared/auth/storage";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DefinitionTab,
  StrategyMapTab,
} from "@/features/strategic-plans/components";
import { FilterField } from "@/shared/components/FilterField";

export default function StrategicPlanPage() {
  const businessUnitId = getBusinessUnitId() ?? undefined;
  const [planId, setPlanId] = useState<string | null>(null);

  return (
    <SidebarLayout
      currentPath="/strategic-plan"
      pageTitle="Strategic Plan"
      onNavigate={() => {}}
    >
      <div className="space-y-6 font-system">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 heading-optimized">
              Strategic Plan
            </h1>
            <p className="text-sm text-gray-600 text-optimized mt-1">
              Define your organizational strategy and visualize the strategic
              map.
            </p>
          </div>

          {/* Filtro reutilizable: planes por BU (auto más reciente) */}
          <div className="w-72">
            <FilterField label="Plan estratégico">
              <StrategicPlanSelect
                businessUnitId={businessUnitId}
                value={planId}
                onChange={setPlanId}
                persist={true}
                clearOnUnmount={true}
              />
            </FilterField>
          </div>
        </div>

        <Tabs defaultValue="definition" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="definition">Definición</TabsTrigger>
            <TabsTrigger value="map">Mapa Estratégico</TabsTrigger>
          </TabsList>

          <TabsContent value="definition" className="mt-6">
            {/* Aquí NO pasamos positionId: DefinitionTab usará el CEO por defecto */}
            <DefinitionTab strategicPlanId={planId ?? undefined} />
          </TabsContent>

          <TabsContent value="map" className="mt-6">
            <StrategyMapTab strategicPlanId={planId ?? undefined} />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
