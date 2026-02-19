// src/features/positions/components/definition-tab.tsx
"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QKEY } from "@/shared/api/query-keys";
import { getHumanErrorMessage } from "@/shared/api/response";
import { getBusinessUnitId } from "@/shared/auth/storage";

// UI
import { DefinitionCard } from "./definition-card";

// Iconos
import { Target, Eye, Flag, FolderKanban, Zap } from "lucide-react";

// Services (Objectives / Projects)
import {
  createObjective,
  updateObjective,
  reorderObjectives,
  getObjectivesAllStatus,
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
  getPositionsByBusinessUnit,
} from "@/features/positions/services/positionsService";
import type { CreateStrategicProjectPayload } from "@/features/strategic-plans/types/strategicProjects";
import type { CreateObjectivePayload } from "@/features/strategic-plans/types/objectives";

// Modales Objetivos
import { NewObjectiveModal } from "@/features/objectives/components/new-objective-modal";
import { ObjectiveInactivateBlockedModal } from "@/features/objectives/components/objective-inactivate-blocked-modal";
import { ConfirmModal } from "@/shared/components/confirm-modal";

// Palancas
import {
  getLevers,
  createLever,
  updateLever,
  reorderLevers,
} from "@/features/positions/services/leversService";

// ✅ Permisos: hook de auth + función pura
import { PERMISSIONS } from "@/shared/auth/permissions.constant";
import { usePermissions } from "@/shared/auth/access-control";
import { DefinitionList, DefinitionListItem } from "./definition-list";
import { useInactivateObjective } from "@/features/strategic-plans/hooks/use-inactivate-objective";

type Props = {
  strategicPlanId?: string;
  positionId?: string;
  year: number;
};

export function DefinitionTab({ strategicPlanId, positionId, year }: Props) {
  const qc = useQueryClient();
  const hasPlanAndPos = !!strategicPlanId && !!positionId;

  // ✅ Calcula permisos
  const permissions = usePermissions({
    positionRead: PERMISSIONS.POSITIONS.READ,
    positionUpdate: PERMISSIONS.POSITIONS.UPDATE,
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
    leversRead: PERMISSIONS.LEVERS.READ,
    leversCreate: PERMISSIONS.LEVERS.CREATE,
    leversUpdate: PERMISSIONS.LEVERS.UPDATE,
    leversDelete: PERMISSIONS.LEVERS.DELETE,
    leversReorder: PERMISSIONS.LEVERS.REORDER,
  });

  // Hover / edición
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<
    null | "mission" | "vision" | "objectives" | "projects" | "levers"
  >(null);
  const [temporaryEditText, setTemporaryEditText] = useState<string>("");

  // Estado modales Objetivos
  const [isCreateObjectiveModalOpen, setIsCreateObjectiveModalOpen] =
    useState(false);
  const [
    isDeleteObjectiveBlockedModalOpen,
    setIsDeleteObjectiveBlockedModalOpen,
  ] = useState(false);
  const [deleteObjectiveBlockedData, setDeleteObjectiveBlockedData] = useState<{
    message?: string;
    projects?: any[];
    priorities?: any[];
    prioritiesByPosition?: any[];
  }>({});

  const [confirm, setConfirm] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({ open: false, message: "", onConfirm: () => {} });

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
      ? QKEY.objectives(strategicPlanId!, positionId!, year)
      : ["objectives", "disabled"],
    queryFn: () => getObjectivesAllStatus(strategicPlanId!, positionId!, year),
    enabled: hasPlanAndPos && Number.isInteger(year),
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

  // ---- Positions (para reasignación) ----
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
    [positions, positionId],
  );

  // ---- Mutations ----
  const updatePositionMutation = useMutation({
    mutationFn: (payload: { mission?: string; vision?: string }) =>
      updatePosition(positionId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.position(positionId!) });
      setEditingSection(null);
      toast.success("Información de la posición actualizada");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const updateObjectiveMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateObjective(id, { name: name.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QKEY.objectives(strategicPlanId!, positionId!, year),
      });
      toast.success("Objetivo actualizado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const reorderObjectivesMutation = useMutation({
    mutationFn: (payload: {
      strategicPlanId: string;
      items: Array<{ id: string; order: number; isActive: boolean }>;
    }) => reorderObjectives(payload),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QKEY.objectives(strategicPlanId!, positionId!, year),
      });
      setEditingSection(null);
      toast.success("Orden de objetivos guardado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const inactivateObjectiveMutation = useInactivateObjective([
    QKEY.objectives(strategicPlanId!, positionId!, year as number),
    QKEY.objectivesUnconfigured(strategicPlanId!, positionId!),
    ["objectives", "ico-board"], // mismo bucket usado en Objectives
  ]);

  const createProjectMutation = useMutation({
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

  const updateProjectMutation = useMutation({
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

  const reorderProjectsMutation = useMutation({
    mutationFn: (payload: {
      strategicPlanId: string;
      items: Array<{ id: string; order: number; isActive: boolean }>;
    }) => reorderStrategicProjects(payload),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QKEY.strategicProjects(strategicPlanId!, positionId!),
      });
      setEditingSection(null);
      toast.success("Orden de proyectos guardado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const createLeverMutation = useMutation({
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

  const updateLeverMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateLever(id, { name: name.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.levers(positionId!) });
      toast.success("Palanca actualizada");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const reorderLeversMutation = useMutation({
    mutationFn: (payload: {
      positionId: string;
      items: Array<{ id: string; order: number; isActive: boolean }>;
    }) => reorderLevers(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.levers(positionId!) });
      setEditingSection(null);
      toast.success("Orden de palancas guardado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  // ---- Mapeos a UI ----
  const mission = position?.mission ?? "";
  const vision = position?.vision ?? "";

  const mappedObjectives = useMemo(() => {
    const arr = Array.isArray(objectives) ? [...objectives] : [];
    arr.sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));
    return arr.map((o: any, idx: number) => ({
      id: idx + 1,
      content: o?.name ?? "",
      metaId: o?.id,
      isActive: o?.isActive ?? true,
    }));
  }, [objectives]);

  const mappedProjects = useMemo(() => {
    const arr = Array.isArray(projects) ? [...projects] : [];
    arr.sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));
    return arr.map((p: any, idx: number) => ({
      id: idx + 1,
      content: p?.name ?? "",
      metaId: p?.id,
      isActive: p?.isActive ?? true,
    }));
  }, [projects]);

  const mappedLevers = useMemo(() => {
    const arr = Array.isArray(levers) ? [...levers] : [];
    arr.sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));
    return arr.map((lv: any, idx: number) => ({
      id: idx + 1,
      content: lv?.name ?? "",
      metaId: lv?.id,
      isActive: lv?.isActive ?? true,
    }));
  }, [levers]);

  // ---- Handlers ----
  const handleStartEditCard = (
    key: "mission" | "vision",
    currentText: string,
  ) => {
    setEditingSection(key);
    setTemporaryEditText(currentText ?? "");
  };

  const handleCancelEditCard = () => {
    setEditingSection(null);
    setTemporaryEditText("");
  };

  const handleSaveEditCard = () => {
    if (!positionId) return;
    const payload: any = {};
    if (editingSection === "mission")
      payload.mission = temporaryEditText.trim();
    if (editingSection === "vision") payload.vision = temporaryEditText.trim();
    if (Object.keys(payload).length) updatePositionMutation.mutate(payload);
    else setEditingSection(null);
  };

  const handleObjectivesReorder = (updated: DefinitionListItem[]) => {
    if (!strategicPlanId) return;
    reorderObjectivesMutation.mutate({
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
    reorderProjectsMutation.mutate({
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
    reorderLeversMutation.mutate({
      positionId,
      items: updated.map((it, idx) => ({
        id: it.metaId!,
        order: idx + 1,
        isActive: it.isActive ?? true,
      })),
    });
  };

  // Handlers para acciones de listas
  const handleCreateProject = (name: string) => {
    createProjectMutation.mutate(name);
  };
  const handleUpdateProject = (id: string, name: string) => {
    updateProjectMutation.mutate({ id, name });
  };
  const handleDeleteProject = (uiIndex: number) => {
    const item = mappedProjects.find((p) => p.id === uiIndex);
    setConfirm({
      open: true,
      message: `¿Estás seguro de que deseas eliminar el proyecto "${item?.content}"?`,
      onConfirm: () => {
        const payload = {
          strategicPlanId: strategicPlanId!,
          items: mappedProjects.map((it, idx) => ({
            id: it.metaId!,
            order: idx + 1,
            isActive: it.id === uiIndex ? false : (it.isActive ?? true),
          })),
        };
        reorderProjectsMutation.mutate(payload);
      },
    });
  };

  const handleCreateLever = (name: string) => {
    createLeverMutation.mutate(name);
  };
  const handleUpdateLever = (id: string, name: string) => {
    updateLeverMutation.mutate({ id, name });
  };
  const handleDeleteLever = (uiIndex: number) => {
    if (!positionId) return;
    const item = mappedLevers.find((l) => l.id === uiIndex);
    setConfirm({
      open: true,
      message: `¿Estás seguro de que deseas eliminar la palanca "${item?.content}"?`,
      onConfirm: () => {
        const payload = {
          positionId,
          items: mappedLevers.map((it, idx) => ({
            id: it.metaId!,
            order: idx + 1,
            isActive: it.id === uiIndex ? false : (it.isActive ?? true),
          })),
        };
        reorderLeversMutation.mutate(payload);
      },
    });
  };

  const handleUpdateObjective = (id: string, name: string) => {
    updateObjectiveMutation.mutate({ id, name });
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
      {permissions.positionRead && (
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
            canEdit={permissions.positionUpdate}
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
            isEditing={editingSection === "vision"}
            editText={editingSection === "vision" ? temporaryEditText : ""}
            hovered={hoveredSection === "vision"}
            onHover={setHoveredSection}
            onEditClick={() => handleStartEditCard("vision", vision)}
            onChangeText={setTemporaryEditText}
            onSave={handleSaveEditCard}
            onCancel={handleCancelEditCard}
            canEdit={permissions.positionUpdate}
          />
        </div>
      )}

      {/* Objetivos & Proyectos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OBJETIVOS: con modal */}
        {permissions.objectivesRead && (
          <DefinitionList
            sectionKey="objectives"
            title="Objetivos"
            items={mappedObjectives}
            icon={Flag}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-100"
            cardColor="bg-indigo-50"
            cardBorderColor="border-indigo-200"
            itemColor="bg-indigo-25"
            itemBorderColor="border-indigo-100"
            badgeColor="bg-indigo-500"
            hovered={hoveredSection === "objectives"}
            isEditing={editingSection === "objectives"}
            onHover={setHoveredSection}
            onStartEdit={() => setEditingSection("objectives")}
            onCancelEdit={() => setEditingSection(null)}
            isReordering={(reorderObjectivesMutation as any).isPending}
            maxLengthCharacter={150}
            // Muestra botón Agregar en header solo si tiene permiso
            onRequestCreate={
              permissions.objectivesCreate
                ? () => setIsCreateObjectiveModalOpen(true)
                : undefined
            }
            onRequestDelete={
              permissions.objectivesDelete
                ? (_uiIndex, item) => {
                    setConfirm({
                      open: true,
                      message: `¿Estás seguro de que deseas eliminar el objetivo "${item.content}"?`,
                      onConfirm: () => {
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
                            } else {
                              toast.success("Objetivo inactivado");
                            }
                          },
                        });
                      },
                    });
                  }
                : undefined
            }
            actions={{
              updateById: permissions.objectivesUpdate
                ? handleUpdateObjective
                : undefined,
              reorder: permissions.objectivesReorder
                ? (updated) => handleObjectivesReorder(updated)
                : undefined,
            }}
          />
        )}

        {/* PROYECTOS: inline */}
        {permissions.projectsRead && (
          <DefinitionList
            sectionKey="projects"
            title="Proyectos Estratégicos"
            items={mappedProjects}
            icon={FolderKanban}
            iconColor="text-amber-700"
            iconBg="bg-amber-100"
            cardColor="bg-amber-50"
            cardBorderColor="border-amber-200"
            itemColor="bg-amber-25"
            itemBorderColor="border-amber-100"
            badgeColor="bg-amber-500"
            hovered={hoveredSection === "projects"}
            isEditing={editingSection === "projects"}
            onHover={setHoveredSection}
            onStartEdit={() => setEditingSection("projects")}
            onCancelEdit={() => setEditingSection(null)}
            isReordering={(reorderProjectsMutation as any).isPending}
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
                ? (updated) => handleProjectsReorder(updated)
                : undefined,
            }}
          />
        )}
      </div>

      {/* PALANCAS */}
      {permissions.leversRead && (
        <DefinitionList
          sectionKey="levers"
          title="Palancas"
          items={mappedLevers}
          icon={Zap}
          iconColor="text-teal-700"
          iconBg="bg-teal-100"
          cardColor="bg-teal-50"
          cardBorderColor="border-teal-200"
          itemColor="bg-teal-25"
          itemBorderColor="border-teal-100"
          badgeColor="bg-teal-500"
          hovered={hoveredSection === "levers"}
          isEditing={editingSection === "levers"}
          onHover={setHoveredSection}
          onStartEdit={() => setEditingSection("levers")}
          onCancelEdit={() => setEditingSection(null)}
          isReordering={(reorderLeversMutation as any).isPending}
          maxLengthCharacter={500}
          actions={{
            create: permissions.leversCreate ? handleCreateLever : undefined,
            updateById: permissions.leversUpdate
              ? handleUpdateLever
              : undefined,
            remove: permissions.leversDelete ? handleDeleteLever : undefined,
            reorder: permissions.leversReorder
              ? (updated) => handleLeversReorder(updated)
              : undefined,
          }}
        />
      )}

      {/* --- MODALES OBJETIVOS --- */}
      <NewObjectiveModal
        open={isCreateObjectiveModalOpen}
        onOpenChange={setIsCreateObjectiveModalOpen}
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
                queryKey: QKEY.objectives(strategicPlanId!, positionId!, year),
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
        positionId={positionId}
        year={year}
        otherPositions={otherPositions}
        onListChanged={(next) =>
          setDeleteObjectiveBlockedData((prev) => ({
            ...prev,
            projects: next.projects,
            prioritiesByPosition: next.prioritiesByPosition,
          }))
        }
      />

      <ConfirmModal
        open={confirm.open}
        title="Confirmar eliminación"
        message={confirm.message}
        onConfirm={() => {
          setConfirm((prev) => ({ ...prev, open: false }));
          confirm.onConfirm();
        }}
        onCancel={() => setConfirm((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
