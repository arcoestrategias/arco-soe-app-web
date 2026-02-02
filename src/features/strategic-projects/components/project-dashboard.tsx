"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Target, CheckSquare, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/shared/utils";
import { ProjectCard } from "./project-card";
import { useProjectsDashboard } from "@/features/strategic-plans/hooks/use-projects-dashboard";
import type { StrategicProjectsDashboardProject } from "@/features/strategic-projects/types/dashboard";
import { ModalFactorsTasks } from "./modal-factors-tasks";
import { ModalStrategicProject } from "./modal-strategic-project";
import {
  updateStrategicProject,
  reorderStrategicProjects,
} from "@/features/strategic-plans/services/strategicProjectsService";
import { toast } from "sonner";
import { getHumanErrorMessage } from "@/shared/api/response";
import { QKEY } from "@/shared/api/query-keys";
import { ConfirmModal } from "@/shared/components/confirm-modal";

import { getBusinessUnitId } from "@/shared/auth/storage";
import { getStrategicPlan } from "@/features/strategic-plans/services/strategicPlansService";
import { exportStrategicProjectsPDF } from "@/features/reports/services/reportsService";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";
import { usePermissions } from "@/shared/auth/access-control";

type Props = {
  strategicPlanId?: string;
  positionId?: string;
};

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "PR";
}
function colorFromId(id: string) {
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-pink-500",
  ];
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return colors[sum % colors.length];
}

export function StrategicProjectsDashboard({
  strategicPlanId,
  positionId,
}: Props) {
  const { data, isLoading, enabled } = useProjectsDashboard(
    strategicPlanId,
    positionId,
  );

  const qc = useQueryClient();

  const permissions = usePermissions({
    canUpdate: PERMISSIONS.STRATEGIC_PROJECTS.UPDATE,
    canDelete: PERMISSIONS.STRATEGIC_PROJECTS.DELETE,
    canDownloadReport: PERMISSIONS.STRATEGIC_PROJECTS.DOWNLOAD_REPORT_PDF,
  });

  // Traer plan (para el payload del reporte)
  const { data: plan } = useQuery({
    queryKey: strategicPlanId
      ? QKEY.strategicPlan(strategicPlanId)
      : ["strategic-plan", "disabled"],
    queryFn: () => getStrategicPlan(strategicPlanId!),
    enabled: !!strategicPlanId,
    staleTime: 60_000,
  });

  // proyecto que se está editando
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  // confirmación de actualización
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
      status?: "OPE" | "IPR" | "CLO" | null;
    };
  }>(null);

  // confirmación de eliminación
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function onEditProject(projectId: string) {
    const raw = (data?.projects ?? []).find((p: any) => p.id === projectId);
    if (!raw) return;
    setEditing(raw);
    setEditOpen(true);
  }

  // Estado para animar barras y manejar modal
  const [animatedProgress, setAnimatedProgress] = useState<
    Record<string, number>
  >({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"factors" | "tasks">("factors");
  const [selectedProject, setSelectedProject] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const mappedProjects = useMemo(() => {
    const apiProjects = data?.projects ?? [];
    return apiProjects.map((p: StrategicProjectsDashboardProject) => ({
      id: p.id, // id
      iniciales: initialsFrom(p.name ?? ""),
      color: colorFromId(p.id),
      titulo: p.name,
      descripcion: p.description ?? "",
      fechaInicio: p.fromAt ?? "",
      fechaFin: p.untilAt ?? "",
      presupuestoProyecto: p.budget ?? 0,
      presupuestoReal: p.executed ?? 0,
      totalTareas: p.tasksTotal ?? 0,
      tareasCompletadas: p.tasksClosed ?? 0,
      cumplimiento: p.compliance ?? 0,
      metaEstrategica: p.objectiveName ?? "",
      factoresClave: p.factorsTotal ?? 0,
    }));
  }, [data?.projects]);

  // Animación de progreso cuando llega data
  useEffect(() => {
    if (!mappedProjects.length) return;
    const timer = setTimeout(() => {
      const next: Record<string, number> = {};
      for (const proj of mappedProjects) {
        next[proj.id] = proj.cumplimiento ?? 0;
      }
      setAnimatedProgress(next);
    }, 300);
    return () => clearTimeout(timer);
  }, [mappedProjects]);

  // Handlers de modal
  const openModal = (
    type: "factors" | "tasks",
    projectId: string,
    projectName: string,
  ) => {
    setModalType(type);
    setSelectedProject({ id: projectId, name: projectName });
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setSelectedProject(null);
  };

  // ---- Exportación (PDF Proyectos)
  const exportMut = useMutation({
    mutationFn: exportStrategicProjectsPDF,
  });

  const handleExport = async (projectId: string, projectName: string) => {
    try {
      const businessUnitId = getBusinessUnitId() ?? undefined;

      if (!enabled || !positionId) {
        toast.error("Selecciona un plan y una posición.");
        return;
      }
      if (!plan) {
        toast.error("No se pudo cargar la información del plan estratégico.");
        return;
      }

      const payload = {
        businessUnitId: businessUnitId!,
        positionId: positionId!,
        projectId,
        strategicPlan: {
          id: plan.id,
          name: plan.name ?? "Plan estratégico",
          // el servicio del plan frecuentemente expone fromAt/untilAt
          periodStart: (plan.fromAt ?? plan.fromAt ?? "").slice(0, 10),
          periodEnd: (plan.untilAt ?? plan.untilAt ?? "").slice(0, 10),
          mission: plan.mission ?? "",
          vision: plan.vision ?? "",
          competitiveAdvantage: plan.competitiveAdvantage ?? "",
        },
      };

      const buffer = await exportMut.mutateAsync(payload);
      const blob = new Blob([buffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const fileSafe =
        (projectName || "proyecto").replace(/[^\p{L}\p{N}\-_ ]/gu, "").trim() ||
        "proyecto";

      const a = document.createElement("a");
      a.href = url;
      a.download = `proyecto-estrategico-${fileSafe}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Reporte generado");
    } catch (e) {
      toast.error(getHumanErrorMessage(e as any));
    }
  };

  // Resumen (usa backend si enabled; si no hay datos, muestra 0)
  const totalProjects = data?.summary?.totalProjects ?? 0;
  const avgProgress = data?.summary?.avgCompliance ?? 0;
  const totalBudget = data?.summary?.totalBudget ?? 0;
  const totalExecuted = data?.summary?.totalExecuted ?? 0;

  // Mensaje cuando faltan filtros
  if (!enabled) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un plan y una posición para ver el dashboard de proyectos.
      </div>
    );
  }

  return (
    <div className="space-y-6 font-system">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-600">Total Proyectos</p>
                <p className="text-xl font-bold text-blue-700">
                  {isLoading ? "…" : totalProjects}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-green-600">
                  Promedio de Proyectos en Progreso
                </p>
                <p className="text-xl font-bold text-green-700">
                  {isLoading ? "…" : `${avgProgress}%`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-purple-600">Presupuesto Total</p>
                <p className="text-xl font-bold text-purple-700">
                  {isLoading ? "…" : formatCurrency(totalBudget)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-orange-600">Ejecutado</p>
                <p className="text-xl font-bold text-orange-700">
                  {isLoading ? "…" : formatCurrency(totalExecuted)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de proyectos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-6 space-y-3">
                  <div className="h-6 w-2/3 bg-gray-200 rounded" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded" />
                  <div className="h-24 w-full bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))
          : mappedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                {...project}
                animatedProgress={animatedProgress[project.id] || 0}
                onOpenModal={openModal}
                onEdit={onEditProject}
                onReport={(pid, name) => handleExport(pid, name)}
                onDelete={(pid) => setPendingDeleteId(pid)}
                canUpdate={permissions.canUpdate}
                canDelete={permissions.canDelete}
                canDownloadReport={permissions.canDownloadReport}
                exporting={exportMut.isPending}
              />
            ))}
      </div>

      {/* Modal */}
      {modalOpen && selectedProject && (
        <ModalFactorsTasks
          isOpen={modalOpen}
          onClose={closeModal}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
        />
      )}

      {editOpen && editing && (
        <ModalStrategicProject
          isOpen={editOpen}
          modo="editar"
          projectId={editing.id}
          strategicPlanId={strategicPlanId}
          positionId={positionId}
          onClose={() => {
            setEditOpen(false);
            setEditing(null);
          }}
          onSave={(res) => {
            if (res.mode === "editar" && res.id) {
              setPendingUpdate({ id: res.id, payload: res.payload });
            }
          }}
          initial={{
            name: editing.name ?? "",
            description: editing.description ?? "",
            objectiveId: editing.objectiveId ?? null,
            fromAt: editing.fromAt ?? undefined,
            untilAt: editing.untilAt ?? undefined,
            budget: editing.budget ?? null,
            status: editing.status ?? "OPE",
          }}
        />
      )}

      <ConfirmModal
        open={!!pendingUpdate}
        title="Guardar cambios"
        message="¿Deseas guardar los cambios del proyecto?"
        onCancel={() => setPendingUpdate(null)}
        onConfirm={async () => {
          if (!pendingUpdate) return;
          try {
            await updateStrategicProject(
              pendingUpdate.id,
              pendingUpdate.payload,
            );

            // Invalida el dashboard actual
            if (strategicPlanId && positionId) {
              await qc.invalidateQueries({
                queryKey: QKEY.strategicProjectsDashboard(
                  strategicPlanId,
                  positionId,
                ),
              });
            }

            toast.success("Proyecto actualizado correctamente");
            setPendingUpdate(null);
            setEditOpen(false);
            setEditing(null);
          } catch (err) {
            toast.error(getHumanErrorMessage(err));
          }
        }}
        confirmText="Guardar"
      />

      <ConfirmModal
        open={!!pendingDeleteId}
        title="Eliminar proyecto"
        message="¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer."
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={async () => {
          if (!pendingDeleteId || !strategicPlanId || !positionId) return;
          try {
            // Usamos reorder para inactivar (soft delete)
            // Necesitamos la lista actual para reconstruir el payload
            const currentProjects = data?.projects ?? [];
            const payload = {
              strategicPlanId,
              items: currentProjects.map((p: any, idx: number) => ({
                id: p.id,
                order: idx + 1,
                isActive: p.id === pendingDeleteId ? false : true,
              })),
            };

            await reorderStrategicProjects(payload);

            await qc.invalidateQueries({
              queryKey: QKEY.strategicProjectsDashboard(
                strategicPlanId,
                positionId,
              ),
            });
            toast.success("Proyecto eliminado correctamente");
            setPendingDeleteId(null);
          } catch (err) {
            toast.error(getHumanErrorMessage(err));
          }
        }}
        confirmText="Eliminar"
      />
    </div>
  );
}

export default StrategicProjectsDashboard;
