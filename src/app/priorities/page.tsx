// /app/priorities/page.tsx
"use client";

import * as React from "react";
import { useState } from "react";

import { SidebarLayout } from "@/shared/layout";
import { getBusinessUnitId } from "@/shared/auth/storage";

// Selects reutilizables
import { StrategicPlanSelect } from "@/shared/filters/components/StrategicPlanSelect";
import { PositionSelect } from "@/shared/filters/components/PositionSelect";
import { MonthSelect } from "@/shared/filters/components/MonthSelect";
import { YearSelect } from "@/shared/filters/components/YearSelect";

// UI
import { FilterField } from "@/shared/components/FilterField";

// Dashboard (debe reenviar onDirtyChange y resetSignal a la tabla)
import PrioritiesDashboard from "@/features/priorities/components/priorities-dashboard";
import { ConfirmModal } from "../../shared/components/confirm-modal";

type PendingChangeKind = "plan" | "position" | "month" | "year";
type PendingChange = {
  kind: PendingChangeKind;
  value: string | null | number;
};

export default function PrioritiesPage() {
  const businessUnitId = getBusinessUnitId() ?? undefined;

  // Filtros
  const [strategicPlanId, setStrategicPlanId] = useState<string | null>(null);
  const [positionId, setPositionId] = useState<string | null>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  // Edición/creación pendiente (tabla “sucia”)
  const [tableDirty, setTableDirty] = useState(false);

  // Señal de reset para la tabla: cada incremento ordena cancelar edición/creación y limpiar borradores
  const [resetSignal, setResetSignal] = useState(0);

  // Cambio pendiente cuando hay edición abierta
  const [pending, setPending] = useState<PendingChange | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // --- Helpers de guardia ---
  const guardedChange = <T,>(
    next: T,
    setState: (v: T) => void,
    kind: PendingChangeKind
  ) => {
    if (tableDirty) {
      setPending({ kind, value: next as any });
      setConfirmOpen(true);
      return;
    }
    setState(next);
  };

  const handleConfirmDiscard = () => {
    setConfirmOpen(false);
    // 1) resetear la tabla
    setResetSignal((s) => s + 1);

    // 2) aplicar el cambio pendiente
    if (!pending) return;
    const { kind, value } = pending;
    switch (kind) {
      case "plan":
        setStrategicPlanId(value as string | null);
        break;
      case "position":
        setPositionId(value as string | null);
        break;
      case "month":
        setMonth(value as number);
        break;
      case "year":
        setYear(value as number);
        break;
    }
    setPending(null);
  };

  const handleCancelDiscard = () => {
    setConfirmOpen(false);
    setPending(null);
  };

  return (
    <SidebarLayout currentPath="/priorities">
      <div className="space-y-6 font-system">
        {/* Encabezado */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 heading-optimized">
              Prioridades
            </h1>
          </div>

          {/* Filtros */}
          <div className="flex gap-3">
            <div className="w-full">
              <FilterField label="Plan estratégico">
                <StrategicPlanSelect
                  businessUnitId={businessUnitId}
                  value={strategicPlanId}
                  onChange={(val) =>
                    guardedChange<string | null>(
                      val,
                      setStrategicPlanId,
                      "plan"
                    )
                  }
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
                  onChange={(val) =>
                    guardedChange<string | null>(val, setPositionId, "position")
                  }
                  defaultFromAuth
                  persist
                  clearOnUnmount
                />
              </FilterField>
            </div>

            <div className="w-full">
              <FilterField label="Mes">
                <MonthSelect
                  value={month}
                  onChange={(val) =>
                    guardedChange<number>(val, setMonth, "month")
                  }
                />
              </FilterField>
            </div>

            <div className="w-full">
              <FilterField label="Año">
                <YearSelect
                  value={year}
                  onChange={(val) =>
                    guardedChange<number>(val, setYear, "year")
                  }
                />
              </FilterField>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        <PrioritiesDashboard
          planId={strategicPlanId ?? undefined}
          positionId={positionId ?? undefined}
          month={month}
          year={year}
          // <<< NUEVO: la tabla informa si está sucia, y recibe señal de reset >>>
          onDirtyChange={setTableDirty}
          resetSignal={resetSignal}
        />
      </div>

      {/* Confirmación para descartar cambios */}
      <ConfirmModal
        open={confirmOpen}
        title="Tienes cambios sin guardar"
        message="Si cambias el filtro perderás los cambios no guardados. ¿Deseas continuar?"
        confirmText="Descartar cambios"
        cancelText="Seguir editando"
        onConfirm={handleConfirmDiscard}
        onCancel={handleCancelDiscard}
        onOpenChange={setConfirmOpen}
      />
    </SidebarLayout>
  );
}
