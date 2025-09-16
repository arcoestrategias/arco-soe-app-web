"use client";

import * as React from "react";
import { useState } from "react";

import { SidebarLayout } from "@/shared/layout";
import { getBusinessUnitId } from "@/shared/auth/storage";

import { StrategicPlanSelect } from "@/shared/filters/components/StrategicPlanSelect";
import { PositionSelect } from "@/shared/filters/components/PositionSelect";

import { YearSelect } from "@/shared/filters/components/YearSelect";

// Wrapper de etiqueta/descripcion (mismo que ya usas en Positions)
import { FilterField } from "@/shared/components/FilterField";
import ObjectivesView from "@/features/objectives/components/objectives-view";

import { getPositionId } from "@/shared/auth/storage";
import { useAuth } from "@/features/auth/context/AuthContext";
import { hasAccess } from "@/shared/auth/access-control";

export default function ObjectivesPage() {
  const { me } = useAuth();
  const canAssignPosition = React.useMemo(
    () => !!me && hasAccess(me, "positionManagement", "assign"), // ← ajusta module/action si aplica
    [me]
  );

  const businessUnitId = getBusinessUnitId() ?? undefined;

  const [strategicPlanId, setStrategicPlanId] = useState<string | null>(null);
  const [positionId, setPositionId] = useState<string | null>(
    getPositionId() ?? null
  );
  const [year, setYear] = useState<number>(new Date().getFullYear());

  React.useEffect(() => {
    if (!canAssignPosition) {
      setPositionId(getPositionId() ?? null);
    }
  }, [canAssignPosition]);

  return (
    <SidebarLayout currentPath="/objectives" onNavigate={() => {}}>
      <div className="space-y-6 font-system">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 heading-optimized">
              Objetivos
            </h1>
            {/* <p className="text-sm text-gray-600 text-optimized mt-1">
              Gestiona y monitorea los objetivos mensuales por posición.
              Selecciona el plan, la posición y el año para visualizar el ICO.
            </p> */}
          </div>

          <div className="flex gap-3">
            <div className="w-full">
              <FilterField label="Plan estratégico">
                <StrategicPlanSelect
                  businessUnitId={businessUnitId}
                  value={strategicPlanId}
                  onChange={setStrategicPlanId}
                  persist
                  clearOnUnmount
                />
              </FilterField>
            </div>

            {canAssignPosition ? (
              <div className="w-full">
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
            ) : null}

            <div className="w-full">
              <FilterField label="Año">
                <YearSelect value={year} onChange={setYear} />
              </FilterField>
            </div>
          </div>
        </div>

        <ObjectivesView
          planId={strategicPlanId ?? undefined}
          positionId={positionId ?? undefined}
          year={year}
        />
      </div>
    </SidebarLayout>
  );
}
