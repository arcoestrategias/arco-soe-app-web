// src/features/strategic-plans/components/definition-tab.tsx
"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { QKEY } from "@/shared/api/query-keys";
import { getHumanErrorMessage } from "@/shared/api/response";
import { getBusinessUnitId, getCompanyId } from "@/shared/auth/storage";
import {
  getStrategicPlan,
  updateStrategicPlan,
} from "@/features/strategic-plans/services/strategicPlansService";
import {
  getStrategicSuccessFactors,
  createStrategicSuccessFactor,
  updateStrategicSuccessFactor,
  reorderStrategicSuccessFactors,
} from "@/features/strategic-plans/services/strategicSuccessFactorsService";
import {
  getStrategicValues,
  createStrategicValue,
  updateStrategicValue,
  reorderStrategicValues,
} from "@/features/strategic-plans/services/strategicValuesService";
import {
  getObjectives,
  createObjective,
  updateObjective,
  reorderObjectives,
} from "@/features/strategic-plans/services/objectivesService";
import {
  getStrategicProjectsByPlanPosition,
  createStrategicProject,
  updateStrategicProject,
  reorderStrategicProjects,
} from "@/features/strategic-plans/services/strategicProjectsService";
import { useCeoPositionId } from "@/features/positions/hooks/use-ceo-position";
import { Button } from "@/components/ui/button";
import { DefinitionCard } from "./definition-card";
import { DefinitionList } from "./definition-list";
import { NewObjectiveModal } from "@/features/objectives/components/new-objective-modal";
import { ObjectiveInactivateBlockedModal } from "@/features/objectives/components/objective-inactivate-blocked-modal";
import {
  Target,
  Eye,
  Shield,
  Award,
  Sparkles,
  Flag,
  FileDown,
} from "lucide-react";
import { CreateStrategicProjectPayload } from "../types/strategicProjects";
import { CreateObjectivePayload } from "../types/objectives";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";
import { usePermissions } from "@/shared/auth/access-control";
import {
  exportStrategicPlanDefinitionsPDF,
  StrategicPlanDefinitionsReportPayload,
} from "@/features/reports/services/reportsService";
import { useInactivateObjective } from "../hooks/use-inactivate-objective";
import { getPositionsByBusinessUnit } from "@/features/positions/services/positionsService";

type Props = {
  strategicPlanId?: string;
  positionId?: string;
};

export function DefinitionTab({ strategicPlanId, positionId }: Props) {
  const hasPlan = !!strategicPlanId;
  const qc = useQueryClient();
  const currentYear = new Date().getFullYear();

  const permissions = usePermissions({
    planDownloadReportPdf: PERMISSIONS.STRATEGIC_PLANS.DOWNLOAD_REPORT_PDF,
    planRead: PERMISSIONS.STRATEGIC_PLANS.READ,
    planUpdate: PERMISSIONS.STRATEGIC_PLANS.UPDATE,
    factorsRead: PERMISSIONS.STRATEGIC_SUCCESS_FACTORS.READ,
    factorsCreate: PERMISSIONS.STRATEGIC_SUCCESS_FACTORS.CREATE,
    factorsUpdate: PERMISSIONS.STRATEGIC_SUCCESS_FACTORS.UPDATE,
    factorsDelete: PERMISSIONS.STRATEGIC_SUCCESS_FACTORS.DELETE,
    factorsReorder: PERMISSIONS.STRATEGIC_SUCCESS_FACTORS.REORDER,
    valuesRead: PERMISSIONS.STRATEGIC_VALUES.READ,
    valuesCreate: PERMISSIONS.STRATEGIC_VALUES.CREATE,
    valuesUpdate: PERMISSIONS.STRATEGIC_VALUES.UPDATE,
    valuesDelete: PERMISSIONS.STRATEGIC_VALUES.DELETE,
    valuesReorder: PERMISSIONS.STRATEGIC_VALUES.REORDER,
    objectivesRead: PERMISSIONS.OBJECTIVES.READ,
    objectivesCreate: PERMISSIONS.OBJECTIVES.CREATE,
    objectivesUpdate: PERMISSIONS.OBJECTIVES.UPDATE,
    objectivesDelete: PERMISSIONS.OBJECTIVES.DELETE,
    objectivesReorder: PERMISSIONS.OBJECTIVES.REORDER,
    projectsRead: PERMISSIONS.STRATEGIC_PROJECTS.READ,
    projectsCreate: PERMISSIONS.STRATEGIC_PROJECTS.CREATE,
    projectsUpdate: PERMISSIONS.STRATEGIC_PROJECTS.UPDATE,
    projectsDelete: PERMISSIONS.STRATEGIC_PROJECTS.DELETE,
    projectsReorder: PERMISSIONS.STRATEGIC_PROJECTS.REORDER,
  });

  // Hover + edición de tarjetas
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<
    | null
    | "mission"
    | "vision"
    | "advantage"
    | "factors"
    | "values"
    | "objectives"
    | "projects"
  >(null);
  const [temporaryEditText, setTemporaryEditText] = useState<string>("");

  // Modales Objetivos
  const [isCreateObjectiveModalOpen, setIsCreateObjectiveModalOpen] =
    useState(false);
  const [
    isDeleteObjectiveBlockedModalOpen,
    setIsDeleteObjectiveBlockedModalOpen,
  ] = useState(false);
  const [deleteObjectiveBlockedData, setDeleteObjectiveBlockedData] = useState<{
    message?: string;
    projects?: any[];
    prioritiesByPosition?: Array<{
      positionId: string;
      positionName: string;
      priorities: Array<{ id: string; name: string }>;
    }>;
  }>({});

  // Posición efectiva (para objetivos/proyectos)
  const businessUnitId = getBusinessUnitId() ?? undefined;
  const { ceoPositionId } = useCeoPositionId(businessUnitId);
  const effectivePositionId = positionId ?? ceoPositionId;

  const buId = getBusinessUnitId();
  const { data: positions = [] } = useQuery({
    queryKey: buId ? QKEY.positionsByBU(buId) : ["positions", "disabled"],
    queryFn: () => getPositionsByBusinessUnit(buId!),
    enabled: !!buId,
    staleTime: 60_000,
  });

  const otherPositions = useMemo(
    () =>
      (positions as Array<{ id: string; name: string }>)
        .filter((p) => p.id !== positionId)
        .map((p) => ({ id: p.id, name: p.name })),
    [positions, positionId]
  );
  // ---- Queries
  const {
    data: plan,
    isPending: planLoading,
    error: planError,
  } = useQuery({
    queryKey: hasPlan
      ? QKEY.strategicPlan(strategicPlanId!)
      : ["strategic-plan", "disabled"],
    queryFn: () => getStrategicPlan(strategicPlanId!),
    enabled: hasPlan,
    staleTime: 60_000,
  });

  const {
    data: factors = [],
    isPending: factorsLoading,
    error: factorsError,
  } = useQuery({
    queryKey: hasPlan
      ? QKEY.strategicSuccessFactors(strategicPlanId!)
      : ["success-factors", "disabled"],
    queryFn: () => getStrategicSuccessFactors(strategicPlanId!),
    enabled: hasPlan,
    staleTime: 60_000,
  });

  const {
    data: values = [],
    isPending: valuesLoading,
    error: valuesError,
  } = useQuery({
    queryKey: hasPlan
      ? QKEY.strategicValues(strategicPlanId!)
      : ["strategic-values", "disabled"],
    queryFn: () => getStrategicValues(strategicPlanId!),
    enabled: hasPlan,
    staleTime: 60_000,
  });

  const {
    data: objectives = [],
    isPending: objectivesLoading,
    error: objectivesError,
  } = useQuery({
    queryKey:
      hasPlan && !!effectivePositionId
        ? QKEY.objectives(strategicPlanId!, effectivePositionId!, currentYear)
        : ["objectives", "disabled"],
    queryFn: () =>
      getObjectives(strategicPlanId!, effectivePositionId!, currentYear),
    enabled: hasPlan && !!effectivePositionId && Number.isInteger(currentYear),
    staleTime: 60_000,
  });

  const {
    data: projects = [],
    isPending: isProjectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey:
      hasPlan && !!effectivePositionId
        ? QKEY.strategicProjects(strategicPlanId!, effectivePositionId!)
        : ["strategic-projects", "structure", "disabled"],
    queryFn: () =>
      getStrategicProjectsByPlanPosition(
        strategicPlanId!,
        effectivePositionId!
      ),
    enabled: hasPlan && !!effectivePositionId,
    staleTime: 60_000,
  });

  // Mutations
  const updatePlanMutation = useMutation({
    mutationFn: (payload: any) =>
      updateStrategicPlan(strategicPlanId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.strategicPlan(strategicPlanId!) });
      toast.success("Información del plan actualizada");
    },
  });

  const updateObjectiveMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateObjective(id, { name: name.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QKEY.objectives(
          strategicPlanId!,
          effectivePositionId!,
          currentYear
        ),
      });
      toast.success("Objetivo actualizado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const reorderObjectivesMutation = useMutation({
    mutationFn: (payload: any) => reorderObjectives(payload),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QKEY.objectives(
          strategicPlanId!,
          effectivePositionId!,
          currentYear
        ),
      });
      toast.success("Orden de objetivos guardado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const inactivateObjectiveMutation = useInactivateObjective([
    QKEY.objectives(
      strategicPlanId!,
      effectivePositionId!,
      currentYear as number
    ),
    QKEY.objectivesUnconfigured(strategicPlanId!, effectivePositionId!),
    ["objectives", "ico-board"],
  ]);

  const createProjectMutation = useMutation({
    mutationFn: (name: string) => {
      const payload: CreateStrategicProjectPayload = {
        name: name.trim(),
        strategicPlanId: strategicPlanId!,
        positionId: effectivePositionId!,
      };
      return createStrategicProject(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QKEY.strategicProjects(
          strategicPlanId!,
          effectivePositionId!
        ),
      });
      toast.success("Proyecto creado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateStrategicProject(id, { name: name.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QKEY.strategicProjects(
          strategicPlanId!,
          effectivePositionId!
        ),
      });
      toast.success("Proyecto actualizado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const reorderProjectsMutation = useMutation({
    mutationFn: (payload: {
      strategicPlanId: string;
      items: Array<{ id: string; order: number; isActive: boolean }>;
    }) => reorderStrategicProjects(payload),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QKEY.strategicProjects(
          strategicPlanId!,
          effectivePositionId!
        ),
      });
      setEditingSection(null);
      toast.success("Orden de proyectos guardado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  // Generar Reporte PDF
  const byOrder = (a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0);

  // 1) Arma el payload con los datos de la UI
  const buildPayload = (): StrategicPlanDefinitionsReportPayload => {
    const companyId = getCompanyId() ?? undefined;
    const businessUnitId = getBusinessUnitId() ?? undefined;

    return {
      companyId,
      businessUnitId,
      strategicPlan: {
        id: plan!.id,
        name: plan?.name ?? "Plan estratégico",
        periodStart: (plan?.fromAt ?? "").slice(0, 10),
        periodEnd: (plan?.untilAt ?? "").slice(0, 10),
        mission: plan?.mission ?? "",
        vision: plan?.vision ?? "",
        competitiveAdvantage: plan?.competitiveAdvantage ?? "",
      },
      successFactors: [...(factors ?? [])].sort(byOrder).map((x: any) => ({
        id: x.id,
        name: x.name ?? "",
        order: x.order ?? 0,
        isActive: x.isActive ?? true,
      })),
      strategicValues: [...(values ?? [])].sort(byOrder).map((x: any) => ({
        id: x.id,
        name: x.name ?? "",
        order: x.order ?? 0,
        isActive: x.isActive ?? true,
      })),
      objectives: [...(objectives ?? [])].sort(byOrder).map((x: any) => ({
        id: x.id,
        name: x.name ?? "",
        order: x.order ?? 0,
        isActive: x.isActive ?? true,
      })),
      strategicProjects: [...(projects ?? [])].sort(byOrder).map((x: any) => ({
        id: x.id,
        name: x.name ?? "",
        order: x.order ?? 0,
        isActive: x.isActive ?? true,
      })),
    };
  };

  // 2) Define la mutation SOLO con la función
  const exportReportMutation = useMutation({
    mutationFn: (payload: StrategicPlanDefinitionsReportPayload) =>
      exportStrategicPlanDefinitionsPDF(payload),
  });

  // 3) Handler del botón
  const handleGenerateReport = async () => {
    try {
      if (!plan) {
        toast.error("No hay información del plan aún.");
        return;
      }
      const payload = buildPayload();
      const buffer = await exportReportMutation.mutateAsync(payload); // <- ya es ArrayBuffer

      const blob = new Blob([buffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `definiciones-estrategicas-${new Date().getFullYear()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Reporte generado");
    } catch (e) {
      toast.error(getHumanErrorMessage(e as any));
    }
  };

  // Loading & error
  const isLoading =
    planLoading ||
    factorsLoading ||
    valuesLoading ||
    objectivesLoading ||
    isProjectsLoading;

  const errorMsg = planError
    ? getHumanErrorMessage(planError as any)
    : factorsError
    ? getHumanErrorMessage(factorsError as any)
    : valuesError
    ? getHumanErrorMessage(valuesError as any)
    : objectivesError
    ? getHumanErrorMessage(objectivesError as any)
    : projectsError
    ? getHumanErrorMessage(projectsError as any)
    : null;

  // Mapeos
  const mission = plan?.mission ?? "";
  const vision = plan?.vision ?? "";
  const competitiveAdvantage = plan?.competitiveAdvantage ?? "";

  const orderBy = (arr: any[]) =>
    [...(Array.isArray(arr) ? arr : [])].sort(
      (a, b) => (a?.order ?? 0) - (b?.order ?? 0)
    );

  const mappedFactors = useMemo(
    () =>
      orderBy(factors).map((x: any, idx: number) => ({
        id: idx + 1,
        content: x.name ?? "",
        metaId: x.id,
        isActive: x.isActive ?? true,
      })),
    [factors]
  );

  const mappedValues = useMemo(
    () =>
      orderBy(values).map((x: any, idx: number) => ({
        id: idx + 1,
        content: x.name ?? "",
        metaId: x.id,
        isActive: x.isActive ?? true,
      })),
    [values]
  );

  const mappedObjectives = useMemo(
    () =>
      orderBy(objectives).map((x: any, idx: number) => ({
        id: idx + 1,
        content: x.name ?? "",
        metaId: x.id,
        isActive: x.isActive ?? true,
      })),
    [objectives]
  );

  const mappedProjects = useMemo(
    () =>
      orderBy(projects).map((x: any, idx: number) => ({
        id: idx + 1,
        content: x.name ?? "",
        metaId: x.id,
        isActive: x.isActive ?? true,
      })),
    [projects]
  );

  // Handlers tarjetas
  const handleStartEditCard = (
    key: "mission" | "vision" | "advantage",
    current: string | undefined
  ) => {
    setEditingSection(key);
    setTemporaryEditText(current ?? "");
  };

  const handleCancelEditCard = () => {
    setEditingSection(null);
    setTemporaryEditText("");
  };

  const handleSaveEditCard = () => {
    if (!strategicPlanId) return;
    const payload: any = {};
    if (editingSection === "mission")
      payload.mission = temporaryEditText.trim();
    if (editingSection === "vision") payload.vision = temporaryEditText.trim();
    if (editingSection === "advantage")
      payload.competitiveAdvantage = temporaryEditText.trim();

    if (Object.keys(payload).length) {
      updatePlanMutation.mutate(payload, {
        onSuccess: () => setEditingSection(null),
      });
    } else {
      setEditingSection(null);
    }
  };

  // Helpers reorder
  const makeReorderPayload = (
    updatedItems: Array<{ metaId?: string; isActive?: boolean }>
  ) => ({
    strategicPlanId: strategicPlanId!,
    items: updatedItems.map((it, idx) => ({
      id: it.metaId!, // UUID
      order: idx + 1,
      isActive: it.isActive ?? true,
    })),
  });

  // Handlers Listas (Factores, Valores, Objetivos, Proyectos)

  // Factores
  const handleCreateFactor = async (name: string) => {
    try {
      await createStrategicSuccessFactor({
        name: name.trim(),
        strategicPlanId: strategicPlanId!,
      });
      qc.invalidateQueries({
        queryKey: QKEY.strategicSuccessFactors(strategicPlanId!),
      });
      toast.success("Factor creado");
    } catch (e) {
      toast.error(getHumanErrorMessage(e as any));
    }
  };

  const handleUpdateFactor = async (id: string, name: string) => {
    try {
      await updateStrategicSuccessFactor(id, { name: name.trim() });
      qc.invalidateQueries({
        queryKey: QKEY.strategicSuccessFactors(strategicPlanId!),
      });
      toast.success("Factor actualizado");
    } catch (e) {
      toast.error(getHumanErrorMessage(e as any));
    }
  };

  const handleDeleteFactor = async (uiIndex: number) => {
    try {
      const payload = makeReorderPayload(
        mappedFactors.map((it) => ({
          metaId: it.metaId,
          isActive: it.id === uiIndex ? false : it.isActive ?? true,
        }))
      );
      await reorderStrategicSuccessFactors(payload);
      qc.invalidateQueries({
        queryKey: QKEY.strategicSuccessFactors(strategicPlanId!),
      });
      toast.success("Factor eliminado");
    } catch (e) {
      toast.error(getHumanErrorMessage(e as any));
    }
  };

  const handleReorderFactors = async (updated: any[]) => {
    try {
      await reorderStrategicSuccessFactors(makeReorderPayload(updated));
      qc.invalidateQueries({
        queryKey: QKEY.strategicSuccessFactors(strategicPlanId!),
      });
      toast.success("Orden guardado exitosamente");
    } catch (e) {
      toast.error(getHumanErrorMessage(e as any));
    }
  };

  // Valores
  const handleCreateValue = async (name: string) => {
    try {
      await createStrategicValue({
        name: name.trim(),
        strategicPlanId: strategicPlanId!,
      });
      qc.invalidateQueries({
        queryKey: QKEY.strategicValues(strategicPlanId!),
      });
      toast.success("Valor creado");
    } catch (e) {
      toast.error(getHumanErrorMessage(e as any));
    }
  };

  const handleUpdateValue = async (id: string, name: string) => {
    try {
      await updateStrategicValue(id, { name: name.trim() });
      qc.invalidateQueries({
        queryKey: QKEY.strategicValues(strategicPlanId!),
      });
      toast.success("Valor actualizado");
    } catch (e) {
      toast.error(getHumanErrorMessage(e as any));
    }
  };

  const handleDeleteValue = async (uiIndex: number) => {
    try {
      const payload = makeReorderPayload(
        mappedValues.map((it) => ({
          metaId: it.metaId,
          isActive: it.id === uiIndex ? false : it.isActive ?? true,
        }))
      );
      await reorderStrategicValues(payload);
      qc.invalidateQueries({
        queryKey: QKEY.strategicValues(strategicPlanId!),
      });
      toast.success("Valor eliminado");
    } catch (e) {
      toast.error(getHumanErrorMessage(e as any));
    }
  };

  const handleReorderValues = async (updated: any[]) => {
    try {
      await reorderStrategicValues(makeReorderPayload(updated));
      qc.invalidateQueries({
        queryKey: QKEY.strategicValues(strategicPlanId!),
      });
      toast.success("Orden guardado exitosamente");
    } catch (e) {
      toast.error(getHumanErrorMessage(e as any));
    }
  };

  // Proyectos
  const handleCreateProject = (name: string) => {
    if (!effectivePositionId) {
      toast.error("No hay posición efectiva seleccionada.");
      return;
    }
    createProjectMutation.mutate(name);
  };

  const handleUpdateProject = (id: string, name: string) => {
    updateProjectMutation.mutate({ id, name });
  };

  const handleDeleteProject = (uiIndex: number) => {
    const payload = {
      strategicPlanId: strategicPlanId!,
      items: mappedProjects.map((it, idx) => ({
        id: it.metaId!,
        order: idx + 1,
        isActive: it.id === uiIndex ? false : it.isActive ?? true,
      })),
    };
    reorderProjectsMutation.mutate(payload);
  };

  const handleReorderProjects = (updatedItems: any[]) => {
    reorderProjectsMutation.mutate({
      strategicPlanId: strategicPlanId!,
      items: updatedItems.map((it, idx) => ({
        id: it.metaId!,
        order: idx + 1,
        isActive: it.isActive ?? true,
      })),
    });
  };

  if (!hasPlan) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un plan para continuar.
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Cargando definición…</div>
    );
  }
  if (errorMsg) {
    return <div className="text-sm text-red-600">{errorMsg}</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {permissions.planDownloadReportPdf && (
        <div className="flex items-center justify-start">
          <Button
            onClick={handleGenerateReport}
            disabled={exportReportMutation.isPending}
            className="btn-gradient h-9"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Reporte
          </Button>
        </div>
      )}
      {/* Misión / Visión */}
      {permissions.planRead && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DefinitionCard
            sectionKey="mission"
            title="Misión"
            content={mission}
            icon={Target}
            iconColor="text-orange-600"
            iconBg="bg-orange-100"
            cardColor="bg-orange-50"
            cardBorderColor="border-orange-200"
            contentColor="bg-white/70"
            contentBorderColor="border-orange-100"
            isEditing={editingSection === "mission"}
            editText={editingSection === "mission" ? temporaryEditText : ""}
            hovered={hoveredSection === "mission"}
            onHover={setHoveredSection}
            onEditClick={() => handleStartEditCard("mission", mission)}
            onChangeText={setTemporaryEditText}
            onSave={handleSaveEditCard}
            onCancel={handleCancelEditCard}
            canEdit={permissions.planUpdate}
          />

          <DefinitionCard
            sectionKey="vision"
            title="Visión"
            content={vision}
            icon={Eye}
            iconColor="text-blue-600"
            iconBg="bg-blue-100"
            cardColor="bg-blue-50"
            cardBorderColor="border-blue-200"
            contentColor="bg-white/70"
            contentBorderColor="border-blue-100"
            isEditing={editingSection === "vision"}
            editText={editingSection === "vision" ? temporaryEditText : ""}
            hovered={hoveredSection === "vision"}
            onHover={setHoveredSection}
            onEditClick={() => handleStartEditCard("vision", vision)}
            onChangeText={setTemporaryEditText}
            onSave={handleSaveEditCard}
            onCancel={handleCancelEditCard}
            canEdit={permissions.planUpdate}
          />
        </div>
      )}

      {/* Ventaja competitiva */}
      {permissions.planRead && (
        <DefinitionCard
          sectionKey="advantage"
          title="Ventaja Distintiva"
          content={competitiveAdvantage}
          icon={Shield}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-100"
          cardColor="bg-emerald-50"
          cardBorderColor="border-emerald-200"
          contentColor="bg-white/70"
          contentBorderColor="border-emerald-100"
          isEditing={editingSection === "advantage"}
          editText={editingSection === "advantage" ? temporaryEditText : ""}
          hovered={hoveredSection === "advantage"}
          onHover={setHoveredSection}
          onEditClick={() =>
            handleStartEditCard("advantage", competitiveAdvantage)
          }
          onChangeText={setTemporaryEditText}
          onSave={handleSaveEditCard}
          onCancel={handleCancelEditCard}
          canEdit={permissions.planUpdate}
        />
      )}

      {/* Factores / Valores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Factores Clave de Éxito */}
        {permissions.factorsRead && (
        <DefinitionList
          sectionKey="factors"
          title="Factores Clave de Éxito"
          items={mappedFactors}
          icon={Award}
          iconColor="text-violet-600"
          iconBg="bg-violet-100"
          cardColor="bg-purple-50"
          cardBorderColor="border-purple-200"
          itemColor="bg-purple-25"
          itemBorderColor="border-purple-100"
          badgeColor="bg-violet-500"
          hovered={hoveredSection === "factors"}
          isEditing={editingSection === "factors"}
          onHover={setHoveredSection}
          onStartEdit={() => setEditingSection("factors")}
          onCancelEdit={() => setEditingSection(null)}
          isReordering={false}
          maxLengthCharacter={150}
          actions={{
            create: permissions.factorsCreate ? handleCreateFactor : undefined,
            updateById: permissions.factorsUpdate
              ? handleUpdateFactor
              : undefined,
            remove: permissions.factorsDelete ? handleDeleteFactor : undefined,
            reorder: permissions.factorsReorder
              ? handleReorderFactors
              : undefined,
          }}
        />
        )}

        {/* Valores Estratégicos */}
        {permissions.valuesRead && (
        <DefinitionList
          sectionKey="values"
          title="Valores"
          items={mappedValues}
          icon={Sparkles}
          iconColor="text-amber-600"
          iconBg="bg-amber-100"
          cardColor="bg-amber-50"
          cardBorderColor="border-amber-200"
          itemColor="bg-amber-25"
          itemBorderColor="border-amber-100"
          badgeColor="bg-amber-500"
          hovered={hoveredSection === "values"}
          isEditing={editingSection === "values"}
          onHover={setHoveredSection}
          onStartEdit={() => setEditingSection("values")}
          onCancelEdit={() => setEditingSection(null)}
          isReordering={false}
          maxLengthCharacter={150}
          actions={{
            create: permissions.valuesCreate ? handleCreateValue : undefined,
            updateById: permissions.valuesUpdate
              ? handleUpdateValue
              : undefined,
            remove: permissions.valuesDelete ? handleDeleteValue : undefined,
            reorder: permissions.valuesReorder
              ? handleReorderValues
              : undefined,
          }}
        />
        )}
      </div>

      {/* Objetivos + Proyectos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {permissions.objectivesRead && (
        <DefinitionList
          sectionKey="objectives"
          title="Objetivos"
          items={mappedObjectives}
          icon={Flag}
          iconColor="text-sky-600"
          iconBg="bg-sky-100"
          cardColor="bg-sky-50"
          cardBorderColor="border-sky-200"
          itemColor="bg-sky-25"
          itemBorderColor="border-sky-100"
          badgeColor="bg-sky-500"
          hovered={hoveredSection === "objectives"}
          isEditing={editingSection === "objectives"}
          onHover={setHoveredSection}
          onStartEdit={() => setEditingSection("objectives")}
          onCancelEdit={() => setEditingSection(null)}
          isReordering={reorderObjectivesMutation.isPending}
          maxLengthCharacter={150}
          onRequestCreate={
            permissions.objectivesCreate
              ? () => setIsCreateObjectiveModalOpen(true)
              : undefined
          }
          onRequestDelete={
            permissions.objectivesDelete
              ? (_uiIndex, item) => {
                  const objectiveId = item.metaId!;
                  inactivateObjectiveMutation.mutate(objectiveId, {
                    onSuccess: (data) => {
                      if (data?.blocked) {
                        setDeleteObjectiveBlockedData({
                          message: data.message,
                          projects: data.associations?.projects ?? [],
                          prioritiesByPosition:
                            data.associations?.prioritiesByPosition ?? [],
                        });
                        setIsDeleteObjectiveBlockedModalOpen(true);
                      }
                    },
                  });
                }
              : undefined
          }
          actions={{
            updateById: permissions.objectivesUpdate
              ? (id, name) => updateObjectiveMutation.mutate({ id, name })
              : undefined,
            reorder: permissions.objectivesReorder
              ? (updated) =>
                  reorderObjectivesMutation.mutate(makeReorderPayload(updated))
              : undefined,
          }}
        />
        )}

        {/* Proyectos */}
        {permissions.projectsRead && (
        <DefinitionList
          sectionKey="projects"
          title="Proyectos Estratégicos"
          items={mappedProjects}
          icon={Shield}
          iconColor="text-emerald-700"
          iconBg="bg-emerald-100"
          cardColor="bg-emerald-50"
          cardBorderColor="border-emerald-200"
          itemColor="bg-emerald-25"
          itemBorderColor="border-emerald-100"
          badgeColor="bg-emerald-600"
          hovered={hoveredSection === "projects"}
          isEditing={editingSection === "projects"}
          onHover={setHoveredSection}
          onStartEdit={() => setEditingSection("projects")}
          onCancelEdit={() => setEditingSection(null)}
          isReordering={reorderProjectsMutation.isPending}
          maxLengthCharacter={150}
          actions={{
            create: permissions.projectsCreate
              ? handleCreateProject
              : undefined,
            updateById: permissions.projectsUpdate
              ? handleUpdateProject
              : undefined,
            remove: permissions.projectsDelete
              ? handleDeleteProject
              : undefined,
            reorder: permissions.projectsReorder
              ? handleReorderProjects
              : undefined,
          }}
        />
        )}
      </div>

      {/* Modales Objetivos */}
      <NewObjectiveModal
        open={isCreateObjectiveModalOpen}
        onOpenChange={setIsCreateObjectiveModalOpen}
        onCreate={(p) => {
          if (!permissions.objectivesCreate) {
            toast.error("No tienes permiso para crear objetivos.");
            return;
          }
          const payload: CreateObjectivePayload = {
            name: (p.objectiveText ?? "").trim(),
            level: p.nivel || "EST",
            indicatorName: p.indicador || "Indicador",
            strategicPlanId: strategicPlanId!,
            positionId: effectivePositionId!,
          };
          createObjective(payload)
            .then(() => {
              qc.invalidateQueries({
                queryKey: QKEY.objectives(
                  strategicPlanId!,
                  effectivePositionId!,
                  currentYear
                ),
              });
              toast.success("Objetivo creado");
              setIsCreateObjectiveModalOpen(false);
            })
            .catch((e) => toast.error(getHumanErrorMessage(e as any)));
        }}
      />

      <ObjectiveInactivateBlockedModal
        open={isDeleteObjectiveBlockedModalOpen}
        message={deleteObjectiveBlockedData.message}
        projects={deleteObjectiveBlockedData.projects}
        prioritiesByPosition={deleteObjectiveBlockedData.prioritiesByPosition}
        onClose={() => setIsDeleteObjectiveBlockedModalOpen(false)}
        strategicPlanId={strategicPlanId}
        positionId={effectivePositionId}
        year={currentYear}
        otherPositions={otherPositions}
        onListChanged={(next) =>
          setDeleteObjectiveBlockedData((prev) => ({
            ...prev,
            projects: next.projects,
            prioritiesByPosition: next.prioritiesByPosition,
          }))
        }
      />
    </div>
  );
}
