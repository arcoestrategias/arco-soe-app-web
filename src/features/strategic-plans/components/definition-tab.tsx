// src/features/strategic-plans/components/definition-tab.tsx
"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { QKEY } from "@/shared/api/query-keys";
import { getHumanErrorMessage } from "@/shared/api/response";
import { getBusinessUnitId, getCompanyId } from "@/shared/auth/storage";

// Services...
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

// UI locales
import { Button } from "@/components/ui/button";
import { DefinitionCard } from "./definition-card";
import { DefinitionList } from "./definition-list";

// Modales de objetivos
import { NewObjectiveModal } from "@/features/objectives/components/new-objective-modal";
import { ObjectiveInactivateBlockedModal } from "@/features/objectives/components/objective-inactivate-blocked-modal";

// Iconos
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

// ✅ Permisos
import { useAuth } from "@/features/auth/context/AuthContext";
import { hasAccess } from "@/shared/auth/access-control";
import {
  exportStrategicPlanDefinitionsPDF,
  StrategicPlanDefinitionsReportPayload,
} from "@/features/reports/services/reportsService";

type Props = {
  strategicPlanId?: string;
  positionId?: string;
};

export function DefinitionTab({ strategicPlanId, positionId }: Props) {
  const hasPlan = !!strategicPlanId;
  const qc = useQueryClient();
  const year = new Date().getFullYear();

  // Hook auth (siempre en el top para no romper reglas de hooks)
  const { me } = useAuth();

  // ✅ Permisos por módulo/acción
  const canPlanUpdate = hasAccess(me, "strategicPlan", "update");

  const canFactorsCreate = hasAccess(me, "strategicSuccessFactor", "create");
  const canFactorsUpdate = hasAccess(me, "strategicSuccessFactor", "update");
  const canFactorsDelete = hasAccess(me, "strategicSuccessFactor", "delete");
  const canFactorsEdit = canFactorsCreate || canFactorsUpdate;

  const canValuesCreate = hasAccess(me, "strategicValue", "create");
  const canValuesUpdate = hasAccess(me, "strategicValue", "update");
  const canValuesDelete = hasAccess(me, "strategicValue", "delete");
  const canValuesEdit = canValuesCreate || canValuesUpdate;

  const canObjectivesCreate = hasAccess(me, "objective", "create");
  const canObjectivesUpdate = hasAccess(me, "objective", "update");
  const canObjectivesDelete = hasAccess(me, "objective", "delete");
  const canObjectivesEdit = canObjectivesCreate || canObjectivesUpdate;

  const canProjectsCreate = hasAccess(me, "strategicProject", "create");
  const canProjectsUpdate = hasAccess(me, "strategicProject", "update");
  const canProjectsDelete = hasAccess(me, "strategicProject", "delete");
  const canProjectsEdit = canProjectsCreate || canProjectsUpdate;

  // Hover + edición de tarjetas
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<
    | null
    | "mission"
    | "vision"
    | "advantage"
    | "factors"
    | "values"
    | "objectives"
    | "projects"
  >(null);
  const [editText, setEditText] = useState<string>("");

  // Modales Objetivos
  const [openCreateObj, setOpenCreateObj] = useState(false);
  const [openBlocked, setOpenBlocked] = useState(false);
  const [blockedPayload, setBlockedPayload] = useState<{
    message?: string;
    projects?: any[];
    priorities?: any[];
  }>({});

  // Posición efectiva (para objetivos/proyectos)
  const businessUnitId = getBusinessUnitId() ?? undefined;
  const { ceoPositionId } = useCeoPositionId(businessUnitId);
  const effectivePositionId = positionId ?? ceoPositionId;

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
        ? QKEY.objectives(strategicPlanId!, effectivePositionId!, year)
        : ["objectives", "disabled"],
    queryFn: () => getObjectives(strategicPlanId!, effectivePositionId!, year),
    enabled: hasPlan && !!effectivePositionId && Number.isInteger(year),
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

  // ---- Mutations
  const updatePlanMut = useMutation({
    mutationFn: (payload: any) =>
      updateStrategicPlan(strategicPlanId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.strategicPlan(strategicPlanId!) });
      toast.success("Información del plan actualizada");
    },
  });

  const createObjectiveMut = useMutation({
    mutationFn: (name: string) => {
      const payload: CreateObjectivePayload = {
        name: name.trim(),
        strategicPlanId: strategicPlanId!,
        positionId: effectivePositionId!,
        level: "EST",
        indicatorName: "Indicador",
      };
      return createObjective(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QKEY.objectives(strategicPlanId!, effectivePositionId!, year),
      });
      toast.success("Objetivo creado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const updateObjectiveMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateObjective(id, { name: name.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QKEY.objectives(strategicPlanId!, effectivePositionId!, year),
      });
      toast.success("Objetivo actualizado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const reorderObjectivesMut = useMutation({
    mutationFn: (payload: any) => reorderObjectives(payload),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QKEY.objectives(strategicPlanId!, effectivePositionId!, year),
      });
      toast.success("Orden de objetivos guardado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const createProjectMut = useMutation({
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

  const updateProjectMut = useMutation({
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

  const reorderProjectsMut = useMutation({
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
      setEditingKey(null);
      toast.success("Orden de proyectos guardado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  // GENERAR REPORTE (PDF)
  const byOrder = (a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0);

  // 1) arma el payload con los datos de la UI
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

  // 2) define la mutation SOLO con la función
  const exportMut = useMutation({
    mutationFn: (payload: StrategicPlanDefinitionsReportPayload) =>
      exportStrategicPlanDefinitionsPDF(payload),
  });

  // 3) handler del botón
  const handleGenerateReport = async () => {
    try {
      if (!plan) {
        toast.error("No hay información del plan aún.");
        return;
      }
      const payload = buildPayload();
      const buffer = await exportMut.mutateAsync(payload); // <- ya es ArrayBuffer

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

  // ---- Loading & error
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

  // ---- Mapeos
  const mission = plan?.mission ?? "";
  const vision = plan?.vision ?? "";
  const competitiveAdvantage = plan?.competitiveAdvantage ?? "";

  const orderBy = (arr: any[]) =>
    [...(Array.isArray(arr) ? arr : [])].sort(
      (a, b) => (a?.order ?? 0) - (b?.order ?? 0)
    );

  const factorsItems = useMemo(
    () =>
      orderBy(factors).map((x: any, idx: number) => ({
        id: idx + 1,
        content: x.name ?? "",
        metaId: x.id,
        isActive: x.isActive ?? true,
      })),
    [factors]
  );

  const valuesItems = useMemo(
    () =>
      orderBy(values).map((x: any, idx: number) => ({
        id: idx + 1,
        content: x.name ?? "",
        metaId: x.id,
        isActive: x.isActive ?? true,
      })),
    [values]
  );

  const objectivesItems = useMemo(
    () =>
      orderBy(objectives).map((x: any, idx: number) => ({
        id: idx + 1,
        content: x.name ?? "",
        metaId: x.id,
        isActive: x.isActive ?? true,
      })),
    [objectives]
  );

  const projectsItems = useMemo(
    () =>
      orderBy(projects).map((x: any, idx: number) => ({
        id: idx + 1,
        content: x.name ?? "",
        metaId: x.id,
        isActive: x.isActive ?? true,
      })),
    [projects]
  );

  // ---- Handlers tarjetas
  const startEditCard = (
    key: "mission" | "vision" | "advantage",
    current: string | undefined
  ) => {
    setEditingKey(key);
    setEditText(current ?? "");
  };

  const cancelEditCard = () => {
    setEditingKey(null);
    setEditText("");
  };

  const saveEditCard = () => {
    if (!strategicPlanId) return;
    const payload: any = {};
    if (editingKey === "mission") payload.mission = editText.trim();
    if (editingKey === "vision") payload.vision = editText.trim();
    if (editingKey === "advantage")
      payload.competitiveAdvantage = editText.trim();

    if (Object.keys(payload).length) {
      updatePlanMut.mutate(payload, { onSuccess: () => setEditingKey(null) });
    } else {
      setEditingKey(null);
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
      <div className="flex items-center justify-start">
        <Button
          onClick={handleGenerateReport}
          disabled={exportMut.isPending}
          className="btn-gradient h-9"
        >
          <FileDown className="h-4 w-4 mr-2" />
          Reporte
        </Button>
      </div>
      {/* Misión / Visión */}
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
          isEditing={editingKey === "mission"}
          editText={editingKey === "mission" ? editText : ""}
          hovered={hoveredKey === "mission"}
          onHover={setHoveredKey}
          onEditClick={() => canPlanUpdate && startEditCard("mission", mission)}
          onChangeText={setEditText}
          onSave={saveEditCard}
          onCancel={cancelEditCard}
          canEdit={canPlanUpdate}
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
          isEditing={editingKey === "vision"}
          editText={editingKey === "vision" ? editText : ""}
          hovered={hoveredKey === "vision"}
          onHover={setHoveredKey}
          onEditClick={() => canPlanUpdate && startEditCard("vision", vision)}
          onChangeText={setEditText}
          onSave={saveEditCard}
          onCancel={cancelEditCard}
          canEdit={canPlanUpdate}
        />
      </div>

      {/* Ventaja competitiva */}
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
        isEditing={editingKey === "advantage"}
        editText={editingKey === "advantage" ? editText : ""}
        hovered={hoveredKey === "advantage"}
        onHover={setHoveredKey}
        onEditClick={() =>
          canPlanUpdate && startEditCard("advantage", competitiveAdvantage)
        }
        onChangeText={setEditText}
        onSave={saveEditCard}
        onCancel={cancelEditCard}
        canEdit={canPlanUpdate}
      />

      {/* Factores / Valores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Factores Clave de Éxito */}
        <DefinitionList
          sectionKey="factors"
          title="Factores Clave de Éxito"
          items={factorsItems}
          icon={Award}
          iconColor="text-violet-600"
          iconBg="bg-violet-100"
          cardColor="bg-purple-50"
          cardBorderColor="border-purple-200"
          itemColor="bg-purple-25"
          itemBorderColor="border-purple-100"
          badgeColor="bg-violet-500"
          hovered={hoveredKey === "factors"}
          isEditing={editingKey === "factors"}
          onHover={setHoveredKey}
          onStartEdit={() => canFactorsEdit && setEditingKey("factors")}
          onCancelEdit={() => setEditingKey(null)}
          isReordering={false}
          maxLengthCharacter={150}
          canEdit={canFactorsEdit}
          canDelete={canFactorsDelete}
          // (no usamos modal aquí; si quisieras, pasa onRequestCreate/onRequestDelete)
          actions={{
            create: canFactorsCreate
              ? async (name: string): Promise<void> => {
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
                }
              : undefined,
            updateById: canFactorsUpdate
              ? async (id: string, name: string): Promise<void> => {
                  try {
                    await updateStrategicSuccessFactor(id, {
                      name: name.trim(),
                    });
                    qc.invalidateQueries({
                      queryKey: QKEY.strategicSuccessFactors(strategicPlanId!),
                    });
                    toast.success("Factor actualizado");
                  } catch (e) {
                    toast.error(getHumanErrorMessage(e as any));
                  }
                }
              : undefined,
            remove: canFactorsDelete
              ? async (uiIndex: number): Promise<void> => {
                  try {
                    const payload = makeReorderPayload(
                      factorsItems.map((it) => ({
                        metaId: it.metaId,
                        isActive:
                          it.id === uiIndex ? false : it.isActive ?? true,
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
                }
              : undefined,
            reorder: canFactorsEdit
              ? async (updated): Promise<void> => {
                  try {
                    await reorderStrategicSuccessFactors(
                      makeReorderPayload(updated)
                    );
                    qc.invalidateQueries({
                      queryKey: QKEY.strategicSuccessFactors(strategicPlanId!),
                    });
                    toast.success("Orden guardado exitosamente");
                  } catch (e) {
                    toast.error(getHumanErrorMessage(e as any));
                  }
                }
              : undefined,
          }}
        />

        {/* Valores Estratégicos */}
        <DefinitionList
          sectionKey="values"
          title="Valores"
          items={valuesItems}
          icon={Sparkles}
          iconColor="text-amber-600"
          iconBg="bg-amber-100"
          cardColor="bg-amber-50"
          cardBorderColor="border-amber-200"
          itemColor="bg-amber-25"
          itemBorderColor="border-amber-100"
          badgeColor="bg-amber-500"
          hovered={hoveredKey === "values"}
          isEditing={editingKey === "values"}
          onHover={setHoveredKey}
          onStartEdit={() => canValuesEdit && setEditingKey("values")}
          onCancelEdit={() => setEditingKey(null)}
          isReordering={false}
          maxLengthCharacter={150}
          canEdit={canValuesEdit}
          canDelete={canValuesDelete}
          actions={{
            create: canValuesCreate
              ? async (name: string): Promise<void> => {
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
                }
              : undefined,
            updateById: canValuesUpdate
              ? async (id: string, name: string): Promise<void> => {
                  try {
                    await updateStrategicValue(id, { name: name.trim() });
                    qc.invalidateQueries({
                      queryKey: QKEY.strategicValues(strategicPlanId!),
                    });
                    toast.success("Valor actualizado");
                  } catch (e) {
                    toast.error(getHumanErrorMessage(e as any));
                  }
                }
              : undefined,
            remove: canValuesDelete
              ? async (uiIndex: number): Promise<void> => {
                  try {
                    const payload = makeReorderPayload(
                      valuesItems.map((it) => ({
                        metaId: it.metaId,
                        isActive:
                          it.id === uiIndex ? false : it.isActive ?? true,
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
                }
              : undefined,
            reorder: canValuesEdit
              ? async (updated): Promise<void> => {
                  try {
                    await reorderStrategicValues(makeReorderPayload(updated));
                    qc.invalidateQueries({
                      queryKey: QKEY.strategicValues(strategicPlanId!),
                    });
                    toast.success("Orden guardado exitosamente");
                  } catch (e) {
                    toast.error(getHumanErrorMessage(e as any));
                  }
                }
              : undefined,
          }}
        />
      </div>

      {/* Objetivos + Proyectos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OBJETIVOS: con modal */}
        <DefinitionList
          sectionKey="objectives"
          title="Objetivos"
          items={objectivesItems}
          icon={Flag}
          iconColor="text-sky-600"
          iconBg="bg-sky-100"
          cardColor="bg-sky-50"
          cardBorderColor="border-sky-200"
          itemColor="bg-sky-25"
          itemBorderColor="border-sky-100"
          badgeColor="bg-sky-500"
          hovered={hoveredKey === "objectives"}
          isEditing={editingKey === "objectives"}
          onHover={setHoveredKey}
          onStartEdit={() => canObjectivesEdit && setEditingKey("objectives")}
          onCancelEdit={() => setEditingKey(null)}
          isReordering={reorderObjectivesMut.isPending}
          maxLengthCharacter={150}
          canEdit={canObjectivesEdit}
          canDelete={canObjectivesDelete}
          onRequestCreate={
            canObjectivesCreate ? () => setOpenCreateObj(true) : undefined
          }
          onRequestDelete={
            canObjectivesDelete
              ? (uiIndex, item) => {
                  setBlockedPayload({
                    message: "Este objetivo tiene asociaciones activas.",
                    projects: [],
                    priorities: [],
                  });
                  setOpenBlocked(true);
                }
              : undefined
          }
          actions={{
            updateById: canObjectivesUpdate
              ? (id, name) => updateObjectiveMut.mutate({ id, name })
              : undefined,
            reorder: canObjectivesEdit
              ? (updated) =>
                  reorderObjectivesMut.mutate(makeReorderPayload(updated))
              : undefined,
          }}
        />

        {/* Proyectos */}
        <DefinitionList
          sectionKey="projects"
          title="Proyectos Estratégicos"
          items={projectsItems}
          icon={Shield}
          iconColor="text-emerald-700"
          iconBg="bg-emerald-100"
          cardColor="bg-emerald-50"
          cardBorderColor="border-emerald-200"
          itemColor="bg-emerald-25"
          itemBorderColor="border-emerald-100"
          badgeColor="bg-emerald-600"
          hovered={hoveredKey === "projects"}
          isEditing={editingKey === "projects"}
          onHover={setHoveredKey}
          onStartEdit={() => canProjectsEdit && setEditingKey("projects")}
          onCancelEdit={() => setEditingKey(null)}
          isReordering={reorderProjectsMut.isPending}
          maxLengthCharacter={150}
          canEdit={canProjectsEdit}
          canDelete={canProjectsDelete}
          actions={{
            create: canProjectsCreate
              ? (name) => {
                  if (!effectivePositionId) {
                    toast.error("No hay posición efectiva seleccionada.");
                    return;
                  }
                  createProjectMut.mutate(name);
                }
              : undefined,
            updateById: canProjectsUpdate
              ? (id, name) => updateProjectMut.mutate({ id, name })
              : undefined,
            remove: canProjectsDelete
              ? (uiIndex) => {
                  const payload = {
                    strategicPlanId: strategicPlanId!,
                    items: projectsItems.map((it, idx) => ({
                      id: it.metaId!,
                      order: idx + 1,
                      isActive: it.id === uiIndex ? false : it.isActive ?? true,
                    })),
                  };
                  reorderProjectsMut.mutate(payload);
                }
              : undefined,
            reorder: canProjectsEdit
              ? (updatedItems) =>
                  reorderProjectsMut.mutate({
                    strategicPlanId: strategicPlanId!,
                    items: updatedItems.map((it, idx) => ({
                      id: it.metaId!,
                      order: idx + 1,
                      isActive: it.isActive ?? true,
                    })),
                  })
              : undefined,
          }}
        />
      </div>

      {/* MODALES Objetivos */}
      <NewObjectiveModal
        open={openCreateObj}
        onOpenChange={setOpenCreateObj}
        onCreate={(p) => {
          if (!canObjectivesCreate) {
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
                  year
                ),
              });
              toast.success("Objetivo creado");
              setOpenCreateObj(false);
            })
            .catch((e) => toast.error(getHumanErrorMessage(e as any)));
        }}
      />

      <ObjectiveInactivateBlockedModal
        open={openBlocked}
        message={blockedPayload.message}
        projects={blockedPayload.projects}
        priorities={blockedPayload.priorities}
        onClose={() => setOpenBlocked(false)}
      />
    </div>
  );
}
