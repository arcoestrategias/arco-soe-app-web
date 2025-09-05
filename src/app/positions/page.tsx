"use client";

import * as React from "react";
import { useState } from "react";

import { SidebarLayout } from "@/shared/layout";
import { getBusinessUnitId } from "@/shared/auth/storage";

// Selects reutilizables
import { StrategicPlanSelect } from "@/shared/filters/components/StrategicPlanSelect";
import { PositionSelect } from "@/shared/filters/components/PositionSelect";

// Definition (positions)
import { DefinitionTab } from "@/features/positions/components/definition-tab";
import { FilterField } from "@/shared/components/FilterField";

export default function PositionsPage() {
  const businessUnitId = getBusinessUnitId() ?? undefined;

  // Estados controlados por la página
  const [planId, setPlanId] = useState<string | null>(null);
  const [positionId, setPositionId] = useState<string | null>(null);

  return (
    <SidebarLayout currentPath="/positions" onNavigate={() => {}}>
      <div className="space-y-6 font-system">
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 heading-optimized">
              Positions
            </h1>
            <p className="text-sm text-gray-600 text-optimized mt-1">
              Trabaja objetivos y proyectos estratégicos por posición.
            </p>
          </div>

          {/* Filtros */}
          <div className="flex gap-3">
            {/* Plan Estratégico (auto: más reciente). Persistimos en filtros y limpiamos al salir de la página */}
            <div className="w-64">
              <FilterField label="Plan estratégico">
                <StrategicPlanSelect
                  businessUnitId={businessUnitId}
                  value={planId}
                  onChange={setPlanId}
                  persist
                  clearOnUnmount
                />
              </FilterField>
            </div>

            {/* Position (auto: la del usuario logueado si existe en la BU). Persistimos y limpiamos al salir */}
            <div className="w-64">
              <FilterField label="Posición">
                <PositionSelect
                  businessUnitId={businessUnitId}
                  value={positionId}
                  onChange={setPositionId}
                  defaultFromAuth
                  persist
                  clearOnUnmount
                />
              </FilterField>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div>
          <DefinitionTab
            strategicPlanId={planId ?? undefined}
            positionId={positionId ?? undefined}
          />
        </div>
      </div>
    </SidebarLayout>
  );
}
