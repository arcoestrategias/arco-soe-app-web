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
import { getPositionId } from "@/shared/auth/storage";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";
import { usePermissions } from "@/shared/auth/access-control";

export default function PositionsPage() {
  const businessUnitId = getBusinessUnitId() ?? undefined;
  const companyId = getCompanyId() ?? undefined;

  const [strategicPlanId, setStrategicPlanId] = useState<string | null>(null);
  const [positionId, setPositionId] = useState<string | null>(
    getPositionId() ?? null
  );

  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const {
    showFilterStrategicPlan,
    showFilterPosition,
    showFilterMonth,
    showFilterYear,
    showDefinitionTab,
    showOrgChartTab,
  } = usePermissions({
    showFilterStrategicPlan: PERMISSIONS.POSITIONS.SHOW_FILTER_STRATEGIC_PLAN,
    showFilterPosition: PERMISSIONS.POSITIONS.SHOW_FILTER_POSITION,
    showFilterMonth: PERMISSIONS.POSITIONS.SHOW_FILTER_MONTH,
    showFilterYear: PERMISSIONS.POSITIONS.SHOW_FILTER_YEAR,
    showDefinitionTab: PERMISSIONS.POSITIONS.SHOW_DEFINITION_TAB,
    showOrgChartTab: PERMISSIONS.POSITIONS.SHOW_ORG_CHART_TAB,
  });

  const defaultTab = showDefinitionTab
    ? "definition"
    : showOrgChartTab
    ? "organigram"
    : undefined;

  React.useEffect(() => {
    if (!showFilterPosition) {
      setPositionId(getPositionId() ?? null);
    }
  }, [showFilterPosition]);

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
            {showFilterStrategicPlan && (
              <FilterField label="Plan estratégico">
                <StrategicPlanSelect
                  businessUnitId={businessUnitId}
                  value={strategicPlanId}
                  onChange={setStrategicPlanId}
                  persist
                  clearOnUnmount
                />
              </FilterField>
            )}
            {showFilterPosition ? (
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
            ) : null}
            {showFilterMonth && (
              <FilterField label="Mes">
                <MonthSelect value={month} onChange={setMonth} />
              </FilterField>
            )}

            {showFilterYear && (
              <FilterField label="Año">
                <YearSelect value={year} onChange={setYear} />
              </FilterField>
            )}
          </div>
        </div>

        {defaultTab && (
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList
              className={`grid w-full bg-gray-100 p-1 rounded-lg ${
                showDefinitionTab && showOrgChartTab
                  ? "grid-cols-2"
                  : "grid-cols-1"
              }`}
            >
              {showDefinitionTab && (
                <TabsTrigger value="definition">Definición</TabsTrigger>
              )}
              {showOrgChartTab && (
                <TabsTrigger value="organigram">Organigrama</TabsTrigger>
              )}
            </TabsList>

            {showDefinitionTab && (
              <TabsContent value="definition" className="mt-6">
                <DefinitionTab
                  strategicPlanId={strategicPlanId ?? undefined}
                  positionId={positionId ?? undefined}
                  year={year ?? undefined}
                />
              </TabsContent>
            )}

            {showOrgChartTab && (
              <TabsContent value="organigram" className="mt-6">
                <OrganizationChartOverview
                  businessUnitId={businessUnitId}
                  strategicPlanId={strategicPlanId ?? undefined}
                  month={month}
                  year={year}
                  positionId={positionId ?? undefined}
                />
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </SidebarLayout>
  );
}
