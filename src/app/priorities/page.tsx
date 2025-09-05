// /app/priorities/page.tsx
"use client";

import * as React from "react";
import { useState } from "react";

import { SidebarLayout } from "@/shared/layout";
import { getBusinessUnitId } from "@/shared/auth/storage";

// Selects reutilizables (usa los mismos paths que YA usas en esta page)
import { StrategicPlanSelect } from "@/shared/filters/components/StrategicPlanSelect";
import { PositionSelect } from "@/shared/filters/components/PositionSelect";
import { MonthSelect } from "@/shared/filters/components/MonthSelect";
import { YearSelect } from "@/shared/filters/components/YearSelect";

// Wrapper de etiqueta/descripcion (mismo que ya usas en Positions)
import { FilterField } from "@/shared/components/FilterField";
import PrioritiesDashboard from "../../features/priorities/components/priorities-dashboard";

export default function PrioritiesPage() {
  const businessUnitId = getBusinessUnitId() ?? undefined;

  // estado de filtros (ajusta a como ya manejas estos states)
  const [strategicPlanId, setStrategicPlanId] = useState<string | null>(null);
  const [positionId, setPositionId] = useState<string | null>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  return (
    <SidebarLayout currentPath="/priorities" onNavigate={() => {}}>
      <div className="space-y-6 font-system">
        {/* Encabezado: IZQ (título/descr) + DER (filtros) */}
        <div className="flex items-start justify-between">
          {/* IZQUIERDA: título + descripción */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 heading-optimized">
              Prioridades
            </h1>
            <p className="text-sm text-gray-600 text-optimized mt-1">
              Gestiona y monitorea las prioridades mensuales por posición.
              Selecciona el plan, la posición y el periodo para visualizar
              cumplimiento e historial.
            </p>
          </div>

          {/* DERECHA: filtros con títulos */}
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

            <div className="w-full">
              <FilterField label="Mes">
                <MonthSelect value={month} onChange={setMonth} />
              </FilterField>
            </div>

            <div className="w-full">
              <FilterField label="Año">
                <YearSelect value={year} onChange={setYear} />
              </FilterField>
            </div>
          </div>
        </div>

        {/* Contenido principal: tu dashboard actual */}
        <PrioritiesDashboard
          planId={strategicPlanId ?? undefined}
          positionId={positionId ?? undefined}
          month={month}
          year={year}
        />
      </div>
    </SidebarLayout>
  );
}
