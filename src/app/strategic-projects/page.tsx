"use client";

import * as React from "react";
import { useState } from "react";

import { SidebarLayout } from "@/shared/layout";
import { getBusinessUnitId, getPositionId } from "@/shared/auth/storage";

// Selects reutilizables
import { StrategicPlanSelect } from "@/shared/filters/components/StrategicPlanSelect";
import { PositionSelect } from "@/shared/filters/components/PositionSelect";

// Dashboard de proyectos
import { StrategicProjectsDashboard } from "@/features/strategic-projects/components/project-dashboard";

// Wrapper de etiqueta/ayuda para filtros
import { FilterField } from "@/shared/components/FilterField";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Modal de proyecto + confirm + helpers
import { ModalStrategicProject } from "@/features/strategic-projects/components/modal-strategic-project";
import { ConfirmModal } from "@/shared/components/confirm-modal";
import { useQueryClient } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import { toast } from "sonner";
import { getHumanErrorMessage } from "@/shared/api/response";
import { createStrategicProject } from "@/features/strategic-plans/services/strategicProjectsService";

// Auth/Permisos
import { PERMISSIONS } from "@/shared/auth/permissions.constant";
import { usePermission } from "@/shared/auth/access-control";
import { usePermissions } from "@/shared/auth/access-control";

export default function StrategicProjectsPage() {
  // Permisos
  const {
    showFilterStrategicPlan,
    showFilterPosition,
    projectsCreate,
    projectsRead,
  } = usePermissions({
    showFilterStrategicPlan:
      PERMISSIONS.STRATEGIC_PROJECTS.SHOW_FILTER_STRATEGIC_PLAN,
    showFilterPosition: PERMISSIONS.STRATEGIC_PROJECTS.SHOW_FILTER_POSITION,
    projectsCreate: PERMISSIONS.STRATEGIC_PROJECTS.CREATE,
    projectsRead: PERMISSIONS.STRATEGIC_PROJECTS.READ,
  });

  const businessUnitId = getBusinessUnitId() ?? undefined;

  // Estados controlados por la página
  const [planId, setPlanId] = useState<string | null>(null);
  const [positionId, setPositionId] = useState<string | null>(
    getPositionId() ?? null
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingCreate, setPendingCreate] = useState<null | {
    payload: {
      name: string;
      description?: string | null;
      fromAt?: string;
      untilAt?: string;
      order?: number | null;
      strategicPlanId: string;
      objectiveId?: string | null;
      positionId: string;
      budget?: number | null;
    };
  }>(null);
  const [pendingUpdate, setPendingUpdate] = useState<null | {
    id: string;
    payload: {
      name: string;
      description?: string | null;
      fromAt?: string;
      untilAt?: string;
      order?: number | null;
      strategicPlanId: string;
      objectiveId?: string | null;
      positionId: string;
      budget?: number | null;
    };
  }>(null);

  const qc = useQueryClient();
  async function invalidateProjectsList(planId: string, positionId: string) {
    await qc.invalidateQueries({
      queryKey: QKEY.strategicProjectsDashboard(planId, positionId),
    });
  }

  React.useEffect(() => {
    if (!showFilterPosition) {
      setPositionId(getPositionId() ?? null);
    }
  }, [showFilterPosition]);

  return (
    <SidebarLayout currentPath="/strategic-projects" onNavigate={() => {}}>
      <div className="space-y-6 font-system">
        {/* Encabezado + Filtros */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 heading-optimized">
              Proyectos Estratégicos
            </h1>
          </div>

          <div className="flex gap-3">
            {/* Plan Estratégico */}
            {showFilterStrategicPlan && (
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
            )}

            {/* Posición */}
            {showFilterPosition ? (
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
            ) : null}

            {/* Botón: Nuevo Proyecto (solo si tiene permiso) */}
            {projectsCreate && (
              <div>
                <FilterField label="Crear un nuevo proyecto">
                  <Button
                    className="h-9 btn-gradient"
                    onClick={() => {
                      if (!planId || !positionId) {
                        toast.error(
                          "Selecciona un Plan estratégico y una Posición antes de crear."
                        );
                        return;
                      }
                      setModalOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Proyecto
                  </Button>
                </FilterField>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard: recibe los IDs seleccionados desde la página */}
        {projectsRead && (
          <StrategicProjectsDashboard
            strategicPlanId={planId ?? undefined}
            positionId={positionId ?? undefined}
          />
        )}
      </div>

      {/* Modal solo si tiene permiso */}
      {projectsCreate && (
        <ModalStrategicProject
          isOpen={modalOpen}
          modo="crear"
          projectId={null}
          strategicPlanId={planId ?? undefined}
          positionId={positionId ?? undefined}
          onClose={() => setModalOpen(false)}
          onSave={(res) => {
            if (res.mode === "crear") {
              setPendingCreate({ payload: res.payload });
            } else {
              if (!res.id) {
                toast.error("No se encontró el ID del proyecto a actualizar.");
                return;
              }
              setPendingUpdate({ id: res.id, payload: res.payload });
            }
          }}
        />
      )}

      {/* Confirm solo si tiene permiso */}
      {projectsCreate && (
        <ConfirmModal
          open={!!pendingCreate}
          title="Crear proyecto"
          message="¿Deseas crear este proyecto estratégico?"
          onCancel={() => setPendingCreate(null)}
          onConfirm={async () => {
            if (!pendingCreate || !planId || !positionId) return;
            try {
              await createStrategicProject(pendingCreate.payload);
              await invalidateProjectsList(planId, positionId);
              toast.success("Proyecto creado correctamente");
              setPendingCreate(null);
              setModalOpen(false);
            } catch (err) {
              toast.error(getHumanErrorMessage(err));
            }
          }}
          confirmText="Crear"
        />
      )}
    </SidebarLayout>
  );
}
