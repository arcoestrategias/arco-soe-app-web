"use client";

import { useState } from "react";
import { SidebarLayout } from "@/shared/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DefinitionTab,
  StrategyMapTab,
} from "@/features/strategic-plan/components";

export default function StrategicPlanPage() {
  const [activeTab, setActiveTab] = useState("definition");

  return (
    <SidebarLayout
      currentPath="/strategic-plan"
      pageTitle="Strategic Plan"
      onNavigate={() => {}}
    >
      <div className="space-y-6 font-system">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 heading-optimized">
            Strategic Plan
          </h1>
          <p className="text-sm text-gray-600 text-optimized mt-1">
            Define your organizational strategy and visualize the strategic map.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger
              value="definition"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black text-muted-foreground text-sm px-6 py-2 rounded-md transition"
            >
              Definición
            </TabsTrigger>
            <TabsTrigger
              value="map"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black text-muted-foreground text-sm px-6 py-2 rounded-md transition"
            >
              Mapa Estratégico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="definition" className="mt-6">
            <DefinitionTab />
          </TabsContent>

          <TabsContent value="map" className="mt-6">
            <StrategyMapTab />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
