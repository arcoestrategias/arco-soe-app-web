"use client";

import * as React from "react";
import { useState } from "react";
import { SidebarLayout } from "@/shared/layout";
import { getBusinessUnitId, getCompanyId } from "@/shared/auth/storage";
import { StrategicPlanSelect } from "@/shared/filters/components/StrategicPlanSelect";
import { PositionSelect } from "@/shared/filters/components/PositionSelect";
import { FilterField } from "@/shared/components/FilterField";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MonthSelect } from "@/shared/filters/components/MonthSelect";
import { YearSelect } from "@/shared/filters/components/YearSelect";
import { DefinitionTab } from "@/features/positions/components/definition-tab";
import { OrganizationChartOverview } from "@/features/resume/components/organization-chart-overview";

export default function PositionsPage() {
  const businessUnitId = getBusinessUnitId() ?? undefined;
  const companyId = getCompanyId() ?? undefined;

  const [strategicPlanId, setStrategicPlanId] = useState<string | null>(null);
  const [positionId, setPositionId] = useState<string | null>(null); // (no se usa en el org chart, pero lo mantengo)
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  return (
    <SidebarLayout currentPath="/positions" onNavigate={() => {}}>
      <div className="space-y-6 font-system">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 heading-optimized">
              Posiciones
            </h1>
            {/* <p className="text-sm text-gray-600 text-optimized mt-1">
              Trabaja objetivos y proyectos estratégicos por posición.
            </p> */}
          </div>

          <div className="flex gap-3">
            <FilterField label="Plan estratégico">
              <StrategicPlanSelect
                businessUnitId={businessUnitId}
                value={strategicPlanId}
                onChange={setStrategicPlanId}
                persist
                clearOnUnmount
              />
            </FilterField>

            <FilterField label="Posición">
              <PositionSelect
                businessUnitId={businessUnitId}
                value={positionId}
                onChange={setPositionId}
                defaultFromAuth
                persist
                clearOnUnmount
                showOptionAll
              />
            </FilterField>

            <FilterField label="Mes">
              <MonthSelect value={month} onChange={setMonth} />
            </FilterField>

            <FilterField label="Año">
              <YearSelect value={year} onChange={setYear} />
            </FilterField>
          </div>
        </div>

        <Tabs defaultValue="definition" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="definition">Definición</TabsTrigger>
            <TabsTrigger value="organigram">Organigrama</TabsTrigger>
          </TabsList>

          <TabsContent value="definition" className="mt-6">
            <DefinitionTab
              strategicPlanId={strategicPlanId ?? undefined}
              positionId={positionId ?? undefined}
            />
          </TabsContent>

          <TabsContent value="organigram" className="mt-6">
            <OrganizationChartOverview
              companyId={companyId}
              businessUnitId={businessUnitId}
              strategicPlanId={strategicPlanId ?? undefined}
              month={month}
              year={year}
              positionId={positionId ?? undefined}
            />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
