// src/features/positions/components/definition-tab.tsx
"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QKEY } from "@/shared/api/query-keys";
import { getHumanErrorMessage } from "@/shared/api/response";

// UI
import { DefinitionCard } from "./definition-card";

// Iconos
import { Target, Eye, Flag, FolderKanban, Zap } from "lucide-react";

// Services (Objectives / Projects)
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

// Position (misión/visión)
import {
  getPosition,
  updatePosition,
} from "@/features/positions/services/positionsService";
import type { CreateStrategicProjectPayload } from "@/features/strategic-plans/types/strategicProjects";
import type { CreateObjectivePayload } from "@/features/strategic-plans/types/objectives";

// Modales Objetivos
import { NewObjectiveModal } from "@/features/objectives/components/new-objective-modal";
import { ObjectiveInactivateBlockedModal } from "@/features/objectives/components/objective-inactivate-blocked-modal";

// Palancas
import {
  getLevers,
  createLever,
  updateLever,
  reorderLevers,
} from "@/features/positions/services/leversService";

// ✅ Permisos: hook de auth + función pura
import { useAuth } from "@/features/auth/context/AuthContext";
import { hasAccess } from "@/shared/auth/access-control";
import { DefinitionList, DefinitionListItem } from "./definition-list";

type Props = {
  strategicPlanId?: string;
  positionId?: string;
};

export function DefinitionTab({ strategicPlanId, positionId }: Props) {
  const qc = useQueryClient();
  const hasPlanAndPos = !!strategicPlanId && !!positionId;

  // ✅ Hook estable (siempre al tope)
  const { me } = useAuth();

  // ✅ Calcula permisos
  const canPositionUpdate = hasAccess(me, "position", "update");

  const canObjectivesCreate = hasAccess(me, "objective", "create");
  const canObjectivesUpdate = hasAccess(me, "objective", "update");
  const canObjectivesDelete = hasAccess(me, "objective", "delete");
  const canObjectivesEdit = canObjectivesCreate || canObjectivesUpdate;

  const canProjectsCreate = hasAccess(me, "strategicProject", "create");
  const canProjectsUpdate = hasAccess(me, "strategicProject", "update");
  const canProjectsDelete = hasAccess(me, "strategicProject", "delete");
  const canProjectsEdit = canProjectsCreate || canProjectsUpdate;

  const canLeversCreate = hasAccess(me, "lever", "create");
  const canLeversUpdate = hasAccess(me, "lever", "update");
  const canLeversDelete = hasAccess(me, "lever", "delete");
  const canLeversEdit = canLeversCreate || canLeversUpdate;

  // Hover / edición
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<
    null | "mission" | "vision" | "objectives" | "projects" | "levers"
  >(null);
  const [editText, setEditText] = useState<string>("");

  // Estado modales Objetivos
  const [openCreateObj, setOpenCreateObj] = useState(false);
  const [openBlocked, setOpenBlocked] = useState(false);
  const [blockedPayload, setBlockedPayload] = useState<{
    message?: string;
    projects?: any[];
    priorities?: any[];
  }>({});

  // ---- Queries ----
  const {
    data: position,
    isPending: isPosLoading,
    error: posError,
  } = useQuery({
    queryKey: positionId ? QKEY.position(positionId) : ["position", "disabled"],
    queryFn: () => getPosition(positionId!),
    enabled: !!positionId,
    staleTime: 60_000,
  });

  const {
    data: objectives = [],
    isPending: isObjectivesLoading,
    error: objectivesError,
  } = useQuery({
    queryKey: hasPlanAndPos
      ? QKEY.objectives(strategicPlanId!, positionId!)
      : ["objectives", "disabled"],
    queryFn: () => getObjectives(strategicPlanId!, positionId!),
    enabled: hasPlanAndPos,
    staleTime: 60_000,
  });

  const {
    data: projects = [],
    isPending: isProjectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: hasPlanAndPos
      ? QKEY.strategicProjects(strategicPlanId!, positionId!)
      : ["strategic-projects", "structure", "disabled"],
    queryFn: () =>
      getStrategicProjectsByPlanPosition(strategicPlanId!, positionId!),
    enabled: hasPlanAndPos,
    staleTime: 60_000,
  });

  const {
    data: levers = [],
    isPending: isLeversLoading,
    error: leversError,
  } = useQuery({
    queryKey: positionId ? QKEY.levers(positionId) : ["levers", "disabled"],
    queryFn: () => getLevers(positionId!),
    enabled: !!positionId,
    staleTime: 60_000,
  });

  // ---- Mutations ----
  const updatePositionMut = useMutation({
    mutationFn: (payload: { mission?: string; vision?: string }) =>
      updatePosition(positionId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.position(positionId!) });
      setEditingKey(null);
      toast.success("Información de la posición actualizada");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const updateObjectiveMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateObjective(id, { name: name.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QKEY.objectives(strategicPlanId!, positionId!),
      });
      toast.success("Objetivo actualizado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const reorderObjectivesMut = useMutation({
    mutationFn: (payload: {
      strategicPlanId: string;
      items: Array<{ id: string; order: number; isActive: boolean }>;
    }) => reorderObjectives(payload),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QKEY.objectives(strategicPlanId!, positionId!),
      });
      setEditingKey(null);
      toast.success("Orden de objetivos guardado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const createProjectMut = useMutation({
    mutationFn: (name: string) => {
      const payload: CreateStrategicProjectPayload = {
        name: name.trim(),
        strategicPlanId: strategicPlanId!,
        positionId: positionId!,
      };
      return createStrategicProject(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QKEY.strategicProjects(strategicPlanId!, positionId!),
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
        queryKey: QKEY.strategicProjects(strategicPlanId!, positionId!),
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
        queryKey: QKEY.strategicProjects(strategicPlanId!, positionId!),
      });
      setEditingKey(null);
      toast.success("Orden de proyectos guardado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const createLeverMut = useMutation({
    mutationFn: (name: string) =>
      createLever({
        positionId: positionId!,
        name: name.trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.levers(positionId!) });
      toast.success("Palanca creada");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const updateLeverMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateLever(id, { name: name.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.levers(positionId!) });
      toast.success("Palanca actualizada");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const reorderLeversMut = useMutation({
    mutationFn: (payload: {
      positionId: string;
      items: Array<{ id: string; order: number; isActive: boolean }>;
    }) => reorderLevers(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.levers(positionId!) });
      setEditingKey(null);
      toast.success("Orden de palancas guardado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  // ---- Mapeos a UI ----
  const mission = position?.mission ?? "";
  const vision = position?.vision ?? "";

  const objectivesOrdered = useMemo(() => {
    const arr = Array.isArray(objectives) ? [...objectives] : [];
    arr.sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));
    return arr;
  }, [objectives]);

  const objectivesItems: DefinitionListItem[] = useMemo(
    () =>
      objectivesOrdered.map((o: any, idx: number) => ({
        id: idx + 1,
        content: o?.name ?? "",
        metaId: o?.id,
        isActive: o?.isActive ?? true,
      })),
    [objectivesOrdered]
  );

  const projectsOrdered = useMemo(() => {
    const arr = Array.isArray(projects) ? [...projects] : [];
    arr.sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));
    return arr;
  }, [projects]);

  const projectsItems: DefinitionListItem[] = useMemo(
    () =>
      projectsOrdered.map((p: any, idx: number) => ({
        id: idx + 1,
        content: p?.name ?? "",
        metaId: p?.id,
        isActive: p?.isActive ?? true,
      })),
    [projectsOrdered]
  );

  const leversOrdered = useMemo(() => {
    const arr = Array.isArray(levers) ? [...levers] : [];
    arr.sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));
    return arr;
  }, [levers]);

  const leversItems: DefinitionListItem[] = useMemo(
    () =>
      leversOrdered.map((lv: any, idx: number) => ({
        id: idx + 1,
        content: lv?.name ?? "",
        metaId: lv?.id,
        isActive: lv?.isActive ?? true,
      })),
    [leversOrdered]
  );

  // ---- Handlers ----
  const startEditCard = (key: "mission" | "vision", currentText: string) => {
    setEditingKey(key);
    setEditText(currentText ?? "");
  };

  const cancelEditCard = () => {
    setEditingKey(null);
    setEditText("");
  };

  const saveEditCard = () => {
    if (!positionId) return;
    const payload: any = {};
    if (editingKey === "mission") payload.mission = editText.trim();
    if (editingKey === "vision") payload.vision = editText.trim();
    if (Object.keys(payload).length) updatePositionMut.mutate(payload);
    else setEditingKey(null);
  };

  const handleObjectivesReorder = (updated: DefinitionListItem[]) => {
    if (!strategicPlanId) return;
    reorderObjectivesMut.mutate({
      strategicPlanId,
      items: updated.map((it, idx) => ({
        id: it.metaId!,
        order: idx + 1,
        isActive: it.isActive ?? true,
      })),
    });
  };

  const handleProjectsReorder = (updated: DefinitionListItem[]) => {
    if (!strategicPlanId) return;
    reorderProjectsMut.mutate({
      strategicPlanId,
      items: updated.map((it, idx) => ({
        id: it.metaId!,
        order: idx + 1,
        isActive: it.isActive ?? true,
      })),
    });
  };

  const handleLeversReorder = (updated: DefinitionListItem[]) => {
    if (!positionId) return;
    reorderLeversMut.mutate({
      positionId,
      items: updated.map((it, idx) => ({
        id: it.metaId!,
        order: idx + 1,
        isActive: it.isActive ?? true,
      })),
    });
  };

  // ---- Loading & Error ----
  const isLoading =
    isPosLoading || isObjectivesLoading || isProjectsLoading || isLeversLoading;

  const firstErr =
    posError ?? objectivesError ?? projectsError ?? leversError ?? null;
  const errorMsg = firstErr ? getHumanErrorMessage(firstErr as any) : null;

  if (!hasPlanAndPos) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un plan y una posición para ver su definición.
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
      {/* Misión / Visión de la POSICIÓN */}
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
          onEditClick={() =>
            canPositionUpdate && startEditCard("mission", mission)
          }
          onChangeText={setEditText}
          onSave={saveEditCard}
          onCancel={cancelEditCard}
          canEdit={canPositionUpdate}
        />

        <DefinitionCard
          sectionKey="vision"
          title="Visión"
          content={vision}
          icon={Eye}
          iconColor="text-blue-600"
          iconBg="bg-blue-100 p-2"
          cardColor="bg-blue-50"
          cardBorderColor="border-blue-200"
          contentColor="bg-white/70"
          contentBorderColor="border-blue-100"
          isEditing={editingKey === "vision"}
          editText={editingKey === "vision" ? editText : ""}
          hovered={hoveredKey === "vision"}
          onHover={setHoveredKey}
          onEditClick={() =>
            canPositionUpdate && startEditCard("vision", vision)
          }
          onChangeText={setEditText}
          onSave={saveEditCard}
          onCancel={cancelEditCard}
          canEdit={canPositionUpdate}
        />
      </div>

      {/* Objetivos & Proyectos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OBJETIVOS: con modal */}
        <DefinitionList
          sectionKey="objectives"
          title="Objetivos"
          items={objectivesItems}
          icon={Flag}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-100"
          cardColor="bg-indigo-50"
          cardBorderColor="border-indigo-200"
          itemColor="bg-indigo-25"
          itemBorderColor="border-indigo-100"
          badgeColor="bg-indigo-500"
          hovered={hoveredKey === "objectives"}
          isEditing={editingKey === "objectives"}
          onHover={setHoveredKey}
          onStartEdit={() => canObjectivesEdit && setEditingKey("objectives")}
          onCancelEdit={() => setEditingKey(null)}
          isReordering={(reorderObjectivesMut as any).isPending}
          maxLengthCharacter={150}
          canEdit={canObjectivesEdit}
          canDelete={canObjectivesDelete}
          // Muestra botón Agregar en header solo si tiene permiso
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
              ? (updated) => handleObjectivesReorder(updated)
              : undefined,
          }}
        />

        {/* PROYECTOS: inline */}
        <DefinitionList
          sectionKey="projects"
          title="Proyectos Estratégicos"
          items={projectsItems}
          icon={FolderKanban}
          iconColor="text-amber-700"
          iconBg="bg-amber-100"
          cardColor="bg-amber-50"
          cardBorderColor="border-amber-200"
          itemColor="bg-amber-25"
          itemBorderColor="border-amber-100"
          badgeColor="bg-amber-500"
          hovered={hoveredKey === "projects"}
          isEditing={editingKey === "projects"}
          onHover={setHoveredKey}
          onStartEdit={() => canProjectsEdit && setEditingKey("projects")}
          onCancelEdit={() => setEditingKey(null)}
          isReordering={(reorderProjectsMut as any).isPending}
          maxLengthCharacter={150}
          canEdit={canProjectsEdit}
          canDelete={canProjectsDelete}
          actions={{
            create: canProjectsCreate
              ? (name) => createProjectMut.mutate(name)
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
              ? (updated) => handleProjectsReorder(updated)
              : undefined,
          }}
        />
      </div>

      {/* PALANCAS */}
      <DefinitionList
        sectionKey="levers"
        title="Palancas"
        items={leversItems}
        icon={Zap}
        iconColor="text-teal-700"
        iconBg="bg-teal-100"
        cardColor="bg-teal-50"
        cardBorderColor="border-teal-200"
        itemColor="bg-teal-25"
        itemBorderColor="border-teal-100"
        badgeColor="bg-teal-500"
        hovered={hoveredKey === "levers"}
        isEditing={editingKey === "levers"}
        onHover={setHoveredKey}
        onStartEdit={() => canLeversEdit && setEditingKey("levers")}
        onCancelEdit={() => setEditingKey(null)}
        isReordering={(reorderLeversMut as any).isPending}
        maxLengthCharacter={150}
        canEdit={canLeversEdit}
        canDelete={canLeversDelete}
        actions={{
          create: canLeversCreate
            ? (name) => createLeverMut.mutate(name)
            : undefined,
          updateById: canLeversUpdate
            ? (id, name) => updateLeverMut.mutate({ id, name })
            : undefined,
          remove: canLeversDelete
            ? (uiIndex) => {
                if (!positionId) return;
                const payload = {
                  positionId,
                  items: leversItems.map((it, idx) => ({
                    id: it.metaId!,
                    order: idx + 1,
                    isActive: it.id === uiIndex ? false : it.isActive ?? true,
                  })),
                };
                reorderLeversMut.mutate(payload);
              }
            : undefined,
          reorder: canLeversEdit
            ? (updated) => handleLeversReorder(updated)
            : undefined,
        }}
      />

      {/* --- MODALES OBJETIVOS --- */}
      <NewObjectiveModal
        open={openCreateObj}
        onOpenChange={setOpenCreateObj}
        onCreate={(p) => {
          const payload: CreateObjectivePayload = {
            name: (p.objectiveText ?? "").trim(),
            level: p.nivel || "EST",
            indicatorName: p.indicador || "Indicador",
            strategicPlanId: strategicPlanId!,
            positionId: positionId!,
          };
          createObjective(payload)
            .then(() => {
              qc.invalidateQueries({
                queryKey: QKEY.objectives(strategicPlanId!, positionId!),
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
