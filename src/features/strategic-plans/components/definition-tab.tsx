// src/features/strategic-plans/components/definition-tab.tsx
"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { QKEY } from "@/shared/api/query-keys";
import { getHumanErrorMessage } from "@/shared/api/response";
import { getBusinessUnitId } from "@/shared/auth/storage";

// --- Services: Strategic Plan (cabecera)
import {
  getStrategicPlan,
  updateStrategicPlan, // PATCH /strategic-plans/:id
} from "@/features/strategic-plans/services/strategicPlansService";

// --- Services: Factores Clave de Éxito
import {
  getStrategicSuccessFactors,
  createStrategicSuccessFactor,
  updateStrategicSuccessFactor,
  reorderStrategicSuccessFactors,
} from "@/features/strategic-plans/services/strategicSuccessFactorsService";

// --- Services: Valores Estratégicos
import {
  getStrategicValues,
  createStrategicValue,
  updateStrategicValue,
  reorderStrategicValues,
} from "@/features/strategic-plans/services/strategicValuesService";

// --- Services: Objetivos
import {
  getObjectives,
  createObjective,
  updateObjective,
  reorderObjectives,
} from "@/features/strategic-plans/services/objectivesService";

// --- Services: Proyectos Estratégicos
import {
  getStrategicProjectsByPlanPosition,
  createStrategicProject,
  updateStrategicProject,
  reorderStrategicProjects,
} from "@/features/strategic-plans/services/strategicProjectsService";

// --- Hook utilitario: posición del CEO de la BU (por defecto)
import { useCeoPositionId } from "@/features/positions/hooks/use-ceo-position";

// UI locales
import { DefinitionCard } from "./definition-card";
import { DefinitionList } from "./definition-list";

// Iconos
import { Target, Eye, Shield, Award, Sparkles, Flag } from "lucide-react";
import { CreateStrategicProjectPayload } from "../types/strategicProjects";

type Props = {
  strategicPlanId?: string;
  /** opcional: si no se provee, se usa el ceoPositionId de la BU actual */
  positionId?: string;
};

export function DefinitionTab({ strategicPlanId, positionId }: Props) {
  const hasPlan = !!strategicPlanId;
  const qc = useQueryClient();

  // Hover + edición de tarjetas de texto
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

  // --- 0) Resolver position efectiva (prop o CEO)
  const businessUnitId = getBusinessUnitId() ?? undefined;
  const { ceoPositionId } = useCeoPositionId(businessUnitId);
  const effectivePositionId = positionId ?? ceoPositionId;

  // --- 1) Plan (cabecera)
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

  // --- 2) Factores
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

  // --- 3) Valores
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

  // --- 4) Objetivos (por plan)
  const {
    data: objectives = [],
    isPending: objectivesLoading,
    error: objectivesError,
  } = useQuery({
    queryKey:
      hasPlan && !!effectivePositionId
        ? QKEY.objectives(strategicPlanId!, effectivePositionId!)
        : ["objectives", "disabled"],
    queryFn: () => getObjectives(strategicPlanId!, effectivePositionId!),
    enabled: hasPlan && !!effectivePositionId,
    staleTime: 60_000,
  });

  // --- 5) Proyectos (estructura por plan + posición efectiva)
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

  // --- Mutations de Plan cabecera
  const updatePlanMut = useMutation({
    mutationFn: (payload: any) =>
      updateStrategicPlan(strategicPlanId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.strategicPlan(strategicPlanId!) });
      toast.success("Información del plan actualizada");
    },
  });

  // --- Mutations Factores
  const createFactorMut = useMutation({
    mutationFn: (name: string) =>
      createStrategicSuccessFactor({
        name: name.trim(),
        strategicPlanId: strategicPlanId!,
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QKEY.strategicSuccessFactors(strategicPlanId!),
      });
      toast.success("Factor creado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const updateFactorMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateStrategicSuccessFactor(id, { name: name.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QKEY.strategicSuccessFactors(strategicPlanId!),
      });
      toast.success("Factor actualizado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const reorderFactorsMut = useMutation({
    mutationFn: (payload: any) => reorderStrategicSuccessFactors(payload),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QKEY.strategicSuccessFactors(strategicPlanId!),
      });
      toast.success("Orden guardado exitosamente");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  // --- Mutations Valores
  const createValueMut = useMutation({
    mutationFn: (name: string) =>
      createStrategicValue({
        name: name.trim(),
        strategicPlanId: strategicPlanId!,
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QKEY.strategicValues(strategicPlanId!),
      });
      toast.success("Valor creado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const updateValueMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateStrategicValue(id, { name: name.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QKEY.strategicValues(strategicPlanId!),
      });
      toast.success("Valor actualizado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const reorderValuesMut = useMutation({
    mutationFn: (payload: any) => reorderStrategicValues(payload),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: QKEY.strategicValues(strategicPlanId!),
      }),
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  // --- Mutations Objetivos
  const createObjectiveMut = useMutation({
    mutationFn: (name: string) =>
      createObjective({
        name: name.trim(),
        strategicPlanId: strategicPlanId!,
        positionId: effectivePositionId!,
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QKEY.objectives(strategicPlanId!, effectivePositionId!),
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
        queryKey: QKEY.objectives(strategicPlanId!, effectivePositionId!),
      });
      toast.success("Objetivo actualizado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const reorderObjectivesMut = useMutation({
    mutationFn: (payload: any) => reorderObjectives(payload),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QKEY.objectives(strategicPlanId!, effectivePositionId!),
      });
      toast.success("Orden de objetivos guardado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  // --- Mutations Proyectos
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

  // --- Estados y errores
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

  // --- Cabecera plan
  const mission = plan?.mission ?? "";
  const vision = plan?.vision ?? "";
  const competitiveAdvantage = plan?.competitiveAdvantage ?? "";

  // --- Ordenados por `order`
  const factorsOrdered = useMemo(() => {
    const arr = Array.isArray(factors) ? [...factors] : [];
    arr.sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));
    return arr;
  }, [factors]);

  const valuesOrdered = useMemo(() => {
    const arr = Array.isArray(values) ? [...values] : [];
    arr.sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));
    return arr;
  }, [values]);

  const objectivesOrdered = useMemo(() => {
    const arr = Array.isArray(objectives) ? [...objectives] : [];
    arr.sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));
    return arr;
  }, [objectives]);

  const projectsOrdered = useMemo(() => {
    const arr = Array.isArray(projects) ? [...projects] : [];
    arr.sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));
    return arr;
  }, [projects]);

  // --- Items para DefinitionList
  const toItems = (list: any[]) =>
    list.map((x: any, idx: number) => ({
      id: idx + 1,
      content: x.name ?? "",
      metaId: x.id,
      isActive: x.isActive ?? true,
    }));

  const factorsItems = useMemo(() => toItems(factorsOrdered), [factorsOrdered]);
  const valuesItems = useMemo(() => toItems(valuesOrdered), [valuesOrdered]);
  const objectivesItems = useMemo(
    () => toItems(objectivesOrdered),
    [objectivesOrdered]
  );
  const projectsItems = useMemo(
    () => toItems(projectsOrdered),
    [projectsOrdered]
  );

  // --- Handlers comunes de tarjetas de texto
  const startEditCard = (
    key: "mission" | "vision" | "advantage",
    currentText: string | undefined
  ) => {
    setEditingKey(key);
    setEditText(currentText ?? "");
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

  // --- Handlers reorder (reciben items con metaId)
  const makeReorderPayload = (
    strategicPlanId: string,
    updatedItems: Array<{
      id: number;
      content: string;
      metaId?: string;
      isActive?: boolean;
    }>
  ) => ({
    strategicPlanId,
    items: updatedItems.map((it, idx) => ({
      id: it.metaId!, // UUID real
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
          onEditClick={() => startEditCard("mission", mission)}
          onChangeText={setEditText}
          onSave={saveEditCard}
          onCancel={cancelEditCard}
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
          onEditClick={() => startEditCard("vision", vision)}
          onChangeText={setEditText}
          onSave={saveEditCard}
          onCancel={cancelEditCard}
        />
      </div>

      {/* Ventaja competitiva */}
      <DefinitionCard
        sectionKey="advantage"
        title="Ventaja competitiva"
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
        onEditClick={() => startEditCard("advantage", competitiveAdvantage)}
        onChangeText={setEditText}
        onSave={saveEditCard}
        onCancel={cancelEditCard}
      />
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
          onStartEdit={() => setEditingKey("factors")}
          onCancelEdit={() => setEditingKey(null)}
          isReordering={reorderFactorsMut.isPending}
          maxLengthCharacter={150}
          actions={{
            create: (name) => createFactorMut.mutate(name),
            updateById: (id, name) => updateFactorMut.mutate({ id, name }),
            remove: (uiIndex) => {
              const payload = {
                strategicPlanId: strategicPlanId!,
                items: factorsItems.map((it, idx) => ({
                  id: it.metaId!,
                  order: idx + 1,
                  isActive: it.id === uiIndex ? false : it.isActive ?? true,
                })),
              };
              reorderFactorsMut.mutate(payload);
            },
            reorder: (updatedItems) =>
              reorderFactorsMut.mutate({
                strategicPlanId: strategicPlanId!,
                items: updatedItems.map((it, idx) => ({
                  id: it.metaId!,
                  order: idx + 1,
                  isActive: it.isActive ?? true,
                })),
              }),
          }}
        />

        {/* Valores Estratégicos */}
        <DefinitionList
          sectionKey="values"
          title="Valores Estratégicos"
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
          onStartEdit={() => setEditingKey("values")}
          onCancelEdit={() => setEditingKey(null)}
          isReordering={reorderValuesMut.isPending}
          maxLengthCharacter={150}
          actions={{
            create: (name) => createValueMut.mutate(name),
            updateById: (id, name) => updateValueMut.mutate({ id, name }),
            remove: (uiIndex) => {
              const payload = {
                strategicPlanId: strategicPlanId!,
                items: valuesItems.map((it, idx) => ({
                  id: it.metaId!,
                  order: idx + 1,
                  isActive: it.id === uiIndex ? false : it.isActive ?? true,
                })),
              };
              reorderValuesMut.mutate(payload);
            },
            reorder: (updatedItems) =>
              reorderValuesMut.mutate({
                strategicPlanId: strategicPlanId!,
                items: updatedItems.map((it, idx) => ({
                  id: it.metaId!,
                  order: idx + 1,
                  isActive: it.isActive ?? true,
                })),
              }),
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Objetivos */}
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
          onStartEdit={() => setEditingKey("objectives")}
          onCancelEdit={() => setEditingKey(null)}
          isReordering={reorderObjectivesMut.isPending}
          maxLengthCharacter={150}
          actions={{
            create: (name) => createObjectiveMut.mutate(name),
            updateById: (id, name) => updateObjectiveMut.mutate({ id, name }),
            remove: (uiIndex) => {
              const payload = {
                strategicPlanId: strategicPlanId!,
                items: objectivesItems.map((it, idx) => ({
                  id: it.metaId!,
                  order: idx + 1,
                  isActive: it.id === uiIndex ? false : it.isActive ?? true,
                })),
              };
              reorderObjectivesMut.mutate(payload);
            },
            reorder: (updatedItems) =>
              reorderObjectivesMut.mutate({
                strategicPlanId: strategicPlanId!,
                items: updatedItems.map((it, idx) => ({
                  id: it.metaId!,
                  order: idx + 1,
                  isActive: it.isActive ?? true,
                })),
              }),
          }}
        />

        {/* Proyectos estratégicos (requieren positionId efectivo) */}
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
          onStartEdit={() => setEditingKey("projects")}
          onCancelEdit={() => setEditingKey(null)}
          isReordering={reorderProjectsMut.isPending}
          maxLengthCharacter={150}
          actions={{
            create: (name) => {
              // Si tu creación requiere positionId (CEO u otra), mantén tu lógica actual:
              if (!effectivePositionId!) return;
              createProjectMut.mutate(name);
            },
            updateById: (id, name) => updateProjectMut.mutate({ id, name }),
            remove: (uiIndex) => {
              const payload = {
                strategicPlanId: strategicPlanId!,
                items: projectsItems.map((it, idx) => ({
                  id: it.metaId!,
                  order: idx + 1,
                  isActive: it.id === uiIndex ? false : it.isActive ?? true,
                })),
              };
              reorderProjectsMut.mutate(payload);
            },
            reorder: (updatedItems) =>
              reorderProjectsMut.mutate({
                strategicPlanId: strategicPlanId!,
                items: updatedItems.map((it, idx) => ({
                  id: it.metaId!,
                  order: idx + 1,
                  isActive: it.isActive ?? true,
                })),
              }),
          }}
        />
      </div>
    </div>
  );
}
