"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useProjectStructure } from "@/features/strategic-projects/hooks/use-project-structure";
import { QKEY } from "@/shared/api/query-keys";
import { getHumanErrorMessage } from "@/shared/api/response";
import { HierarchicalTable } from "./hierarchical-table";

import type {
  StrategicProjectStructureFactor as Factor,
  StrategicProjectStructureTask as Task,
} from "@/features/strategic-projects/types/strategicProjectStructure";

import {
  createProjectFactor,
  updateProjectFactor,
  setProjectFactorActive,
  reorderProjectFactors,
} from "@/features/strategic-projects/services/projectFactorsService";

import {
  createProjectTask,
  updateProjectTask,
  setProjectTaskActive,
  reorderProjectTasks,
} from "@/features/strategic-projects/services/projectTasksService";

import * as AuthStorage from "@/shared/auth/storage";
import * as FiltersStorage from "@/shared/filters/storage";
import { PlanRangeProvider } from "@/features/strategic-projects/context/plan-range.context";
import {
  projectRangeToDates,
  todayClampedYmd,
  parseYmdOrIsoToLocalDate,
} from "@/shared/utils/dateFormatters";

// 🆕 overlay + hook
import { BlockingProgressOverlay } from "@/shared/components/blocking-progress-overlay";
import { useBlockingProgress } from "@/shared/hooks/use-blocking-progress";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";
import { usePermissions } from "@/shared/auth/access-control";

interface ModalFactorsTasksProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string; // UUID real
  projectName: string;
}

export function ModalFactorsTasks({
  isOpen,
  onClose,
  projectId,
  projectName,
}: ModalFactorsTasksProps) {
  const qc = useQueryClient();
  const { data, isPending, isError, error } = useProjectStructure(projectId);
  const blocking = useBlockingProgress();

  const [factors, setFactors] = useState<Factor[]>([]);
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [editingFactorId, setEditingFactorId] = useState<string | null>(null);
  const [editingTaskByFactor, setEditingTaskByFactor] = useState<
    Record<string, string | null>
  >({});

  const permissions = usePermissions({
    factorsRead: PERMISSIONS.PROJECT_FACTORS.READ,
    factorsCreate: PERMISSIONS.PROJECT_FACTORS.CREATE,
    factorsUpdate: PERMISSIONS.PROJECT_FACTORS.UPDATE,
    factorsDelete: PERMISSIONS.PROJECT_FACTORS.DELETE,
    factorsReorder: PERMISSIONS.PROJECT_FACTORS.REORDER,
    tasksRead: PERMISSIONS.PROJECT_TASKS.READ,
    tasksCreate: PERMISSIONS.PROJECT_TASKS.CREATE,
    tasksUpdate: PERMISSIONS.PROJECT_TASKS.UPDATE,
    tasksDelete: PERMISSIONS.PROJECT_TASKS.DELETE,
    tasksReorder: PERMISSIONS.PROJECT_TASKS.REORDER,
  });

  // Rango del PROYECTO
  const projectFromAt = data?.project?.fromAt ?? null;
  const projectUntilAt = data?.project?.untilAt ?? null;
  const { min: projectMin, max: projectMax } = projectRangeToDates(
    projectFromAt,
    projectUntilAt
  );

  useEffect(() => {
    if (isError) toast.error(getHumanErrorMessage(error));
  }, [isError, error]);

  // 🆕 Mostrar overlay en carga inicial/refresh (sin invadir overlays de acciones)
  useEffect(() => {
    if (isPending) {
      if (!blocking.open) blocking.start("Cargando factores y tareas…");
    } else {
      if (blocking.open && blocking.label.startsWith("Cargando")) {
        // cerramos sólo si lo abrió este ciclo de carga
        blocking.stop();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending]);

  // 🆕 Al llegar factores: preserva expandido/colapsado; nuevos factores → abiertos
  useEffect(() => {
    const fs = data?.project?.factors ?? [];
    const sorted = [...fs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setFactors(sorted);

    setExpandedMap((prev) => {
      if (!sorted.length) return {};
      // por defecto: abrir todos
      const next: Record<string, boolean> = {};
      for (const f of sorted) {
        next[f.id] = prev.hasOwnProperty(f.id) ? prev[f.id] : true; // NUEVOS → abiertos
      }
      return next;
    });

    // NO toques edición actual; sólo resetea si el factor ya no existe
    setEditingFactorId((curr) =>
      curr && sorted.some((f) => f.id === curr) ? curr : null
    );
    setEditingTaskByFactor((curr) => {
      const next: Record<string, string | null> = {};
      for (const f of sorted) {
        const v = curr[f.id];
        next[f.id] = v && (f.tasks ?? []).some((t) => t.id === v) ? v : null;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.project?.factors]);

  const refetch = () =>
    qc.invalidateQueries({
      queryKey: QKEY.strategicProjectStructure(projectId),
    });

  /* ---------------- Helpers ---------------- */
  function resolveCurrentPositionId(): string | null {
    try {
      const posFromFilter = (FiltersStorage as any)?.getFilter?.("positionId");
      if (typeof posFromFilter === "string" && posFromFilter)
        return posFromFilter;
    } catch {}
    try {
      const posFromAuth = (AuthStorage as any)?.getPositionId?.();
      if (typeof posFromAuth === "string" && posFromAuth) return posFromAuth;
    } catch {}
    return null;
  }

  function resolveDefaultParticipantId(): string | null {
    const posId = resolveCurrentPositionId();
    const participants = data?.project?.participants ?? [];
    if (posId) {
      const match = participants.find(
        (p) => p.positionId === posId && p.isActive
      );
      if (match) return match.id;
    }
    return null;
  }

  function assertDatesWithinProject(
    fromAt?: string | null,
    untilAt?: string | null
  ) {
    if (!projectMin || !projectMax) return;
    const f = parseYmdOrIsoToLocalDate(fromAt ?? undefined);
    const u = parseYmdOrIsoToLocalDate(untilAt ?? undefined);
    if (f && f < projectMin)
      throw new Error("La fecha inicio no puede ser anterior al Proyecto.");
    if (f && f > projectMax)
      throw new Error("La fecha inicio no puede ser posterior al Proyecto.");
    if (u && u < projectMin)
      throw new Error("La fecha fin no puede ser anterior al Proyecto.");
    if (u && u > projectMax)
      throw new Error("La fecha fin no puede ser posterior al Proyecto.");
    if (f && u && f > u)
      throw new Error(
        "La fecha de inicio no puede ser mayor que la fecha de fin."
      );
  }

  /* ---------------- REORDEN ---------------- */
  async function handleReorderFactors(newOrder: Factor[]) {
    await blocking.withBlocking("Guardando orden de factores…", async () => {
      const items = newOrder.map((f, i) => ({
        id: f.id,
        order: i + 1,
        isActive: f.isActive,
      }));
      await reorderProjectFactors(projectId, items);
      await refetch();
      toast.success("Orden de factores actualizado");
    });
  }

  async function handleReorderTasks(factorId: string, next: Task[]) {
    await blocking.withBlocking("Guardando orden de tareas…", async () => {
      const items = next.map((t, i) => ({
        id: t.id,
        order: i + 1,
        isActive: t.isActive,
      }));
      await reorderProjectTasks(factorId, items);
      await refetch();
      toast.success("Orden de tareas actualizado");
    });
  }

  /* ---------------- FACTOR CRUD ---------------- */
  function startCreateFactor() {
    const draft: Factor = {
      id: `__new__:${crypto.randomUUID()}`,
      name: "",
      description: "",
      result: null,
      projectId,
      order: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      tasks: [],
      taskOpe: 0,
      taskClo: 0,
    };
    setFactors((prev) => [
      draft,
      ...prev.map((f, idx) => ({ ...f, order: idx + 2 })),
    ]);
    setExpandedMap((prev) => ({ ...prev, [draft.id]: true })); // abrir el nuevo
    setEditingFactorId(draft.id);
  }

  async function saveFactor(factor: Factor) {
    // 1) Validación UI
    const name = factor.name?.trim() ?? "";
    if (!name) {
      toast.error("El nombre del factor es obligatorio.");
      return;
    }
    // Duplicado (case-insensitive) dentro del proyecto
    if (
      isDuplicateFactorName(
        name,
        factors,
        factor.id.startsWith("__new__") ? undefined : factor.id
      )
    ) {
      toast.error("Ya existe un factor con ese nombre en este proyecto");
      // *Importante:* mantener edición abierta para que el usuario corrija
      setEditingFactorId(factor.id);
      return;
    }

    // 2) Llamada al API con overlay y manejo de error sin cerrar edición
    const isCreate = factor.id.startsWith("__new__");
    let success = false;

    try {
      await blocking.withBlocking(
        isCreate ? "Creando factor…" : "Actualizando factor…",
        async () => {
          if (isCreate) {
            await createProjectFactor({
              projectId,
              name, // <- ya viene trimmed
              result: (factor.result ?? "").trim(),
            });
            toast.success("Factor creado");
          } else {
            await updateProjectFactor(factor.id, {
              name, // <- trimmed
              result: (factor.result ?? "").trim(),
            });
            toast.success("Factor actualizado");
          }
          await refetch();
          success = true;
        }
      );
    } catch (e) {
      // Mostramos el mensaje real del backend (ej: "Factor name must be unique within the project")
      toast.error(getHumanErrorMessage(e));
      // Mantener edición abierta:
      setEditingFactorId(factor.id);
      return;
    }

    // 3) Si salió bien, ya puedes cerrar edición
    if (success) {
      setEditingFactorId(null);
    }
  }

  function editFactor(factorId: string) {
    setExpandedMap((prev) => ({ ...prev, [factorId]: true }));
    setEditingFactorId(factorId);
  }

  function cancelFactor(factorId: string) {
    if (factorId.startsWith("__new__")) {
      setFactors((prev) =>
        prev
          .filter((f) => f.id !== factorId)
          .map((f, idx) => ({ ...f, order: idx + 1 }))
      );
      setExpandedMap((prev) => {
        const { [factorId]: _, ...rest } = prev;
        return rest;
      });
    }
    setEditingFactorId(null);
  }

  async function deleteFactor(factorId: string) {
    await blocking.withBlocking("Inactivando factor…", async () => {
      await setProjectFactorActive(factorId, false);
      await refetch();
      toast.success("Factor inactivado");
    });
  }

  /* ---------------- TAREA CRUD ---------------- */
  function startCreateTask(factorId: string) {
    const draftId = `__new__:${crypto.randomUUID()}`;
    const defaultParticipantId = resolveDefaultParticipantId();
    const ymdToday = todayClampedYmd(projectMin, projectMax);

    setFactors((prev) =>
      prev.map((f) => {
        if (f.id !== factorId) return f;
        const draft: Task = {
          id: draftId,
          name: "",
          description: "",
          order: 1,
          fromAt: ymdToday,
          untilAt: ymdToday,
          finishedAt: null,
          status: "OPE",
          props: null,
          result: null,
          methodology: null,
          budget: 0,
          limitation: null,
          comments: null,
          projectFactorId: f.id,
          projectParticipantId: defaultParticipantId ?? "",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: null,
        };
        const tasks = [
          draft,
          ...(f.tasks ?? []).map((t, i) => ({ ...t, order: i + 2 })),
        ];
        return { ...f, tasks };
      })
    );

    setExpandedMap((prev) => ({ ...prev, [factorId]: true }));
    setEditingTaskByFactor((prev) => ({ ...prev, [factorId]: draftId }));
  }

  async function saveTask(factorId: string, task: Task) {
    await blocking.withBlocking(
      task.id.startsWith("__new__") ? "Creando tarea…" : "Actualizando tarea…",
      async () => {
        // Validación fechas proyecto
        assertDatesWithinProject(
          task.fromAt ?? undefined,
          task.untilAt ?? undefined
        );

        const toNull = (v?: string | null) =>
          (typeof v === "string" ? v.trim() : v) || null;

        if (!task.id.startsWith("__new__")) {
          await updateProjectTask(task.id, {
            name: task.name,
            description: toNull(task.description),
            result: toNull(task.result),
            limitation: toNull(task.limitation),
            methodology: toNull(task.methodology),
            comments: toNull(task.comments),
            props: toNull(task.props),
            fromAt: task.fromAt,
            untilAt: task.untilAt,
            status: task.status,
            budget: task.budget,
            projectParticipantId: task.projectParticipantId ?? null,
            finishedAt: task.finishedAt ?? null,
          });
          await refetch();
          toast.success("Tarea actualizada");
          return;
        }

        if (!task.name?.trim()) {
          toast.error("El nombre de la tarea es obligatorio.");
          return;
        }

        const fallbackParticipantId = resolveDefaultParticipantId();

        await createProjectTask({
          projectFactorId: factorId,
          name: task.name,
          description: toNull(task.description),
          result: toNull(task.result),
          limitation: toNull(task.limitation),
          methodology: toNull(task.methodology),
          comments: toNull(task.comments),
          props: toNull(task.props),
          fromAt: task.fromAt ?? undefined,
          untilAt: task.untilAt ?? undefined,
          status: task.status ?? "OPE",
          budget: task.budget ?? 0,
          projectParticipantId:
            task.projectParticipantId || fallbackParticipantId || undefined,
        });

        await refetch();
        toast.success("Tarea creada");
      }
    );

    setExpandedMap((prev) => ({ ...prev, [factorId]: true })); // mantener abierto
    setEditingTaskByFactor((prev) => ({ ...prev, [factorId]: null }));
  }

  function editTask(factorId: string, taskId: string) {
    setExpandedMap((prev) => ({ ...prev, [factorId]: true }));
    setEditingTaskByFactor((prev) => ({ ...prev, [factorId]: taskId }));
  }

  function cancelTask(factorId: string, taskId: string) {
    setFactors((prev) =>
      prev.map((f) => {
        if (f.id !== factorId) return f;
        if (taskId.startsWith("__new__")) {
          const left = (f.tasks ?? [])
            .filter((t) => t.id !== taskId)
            .map((t, i) => ({ ...t, order: i + 1 }));
          return { ...f, tasks: left };
        }
        return f;
      })
    );
    setEditingTaskByFactor((prev) => ({ ...prev, [factorId]: null }));
  }

  async function deleteTask(taskId: string) {
    await blocking.withBlocking("Inactivando tarea…", async () => {
      await setProjectTaskActive(taskId, false);
      await refetch();
      toast.success("Tarea inactivada");
    });
  }

  /* ---------------- expandir ---------------- */
  const toggleExpandFactor = (factorId: string) =>
    setExpandedMap((prev) => ({ ...prev, [factorId]: !prev[factorId] }));

  const toggleExpandAll = () => {
    if (!factors.length) return;
    const allOpen = factors.every((f) => expandedMap[f.id]);
    const next: Record<string, boolean> = {};
    for (const f of factors) next[f.id] = !allOpen; // si todos abiertos, cierra todos; si no, abre todos
    setExpandedMap(next);
  };

  const loading = isPending;

  function normalizeName(s?: string | null) {
    return (s ?? "").trim().toLowerCase();
  }

  function isDuplicateFactorName(
    name: string,
    factors: Factor[],
    excludeId?: string
  ) {
    const norm = normalizeName(name);
    return factors.some(
      (f) =>
        f.id !== excludeId &&
        normalizeName(f.name) === norm &&
        f.isActive !== false
    );
  }

  const isAnyTaskEditing = Object.values(editingTaskByFactor).some(Boolean);
  const isAnyFactorEditing = !!editingFactorId;

  const dragDisabled = blocking.open || isAnyFactorEditing || isAnyTaskEditing || !permissions.factorsReorder;
  const dragDisabledReason = blocking.open
    ? blocking.label || "Operación en curso…"
    : isAnyFactorEditing
    ? "No puedes reordenar mientras editas un factor."
    : isAnyTaskEditing
    ? "No puedes reordenar mientras editas o creas una tarea."
    : !permissions.factorsReorder
    ? "No tienes permiso para reordenar factores."
    : "";

  function invalidateProjectsList() {
    // planId: primero lo tomo del proyecto cargado en la modal (fuente más confiable),
    // si no existe, caigo al filtro persistido.
    let planId: string | null = data?.project?.strategicPlanId ?? null;
    if (!planId) {
      try {
        planId =
          (FiltersStorage as any)?.getFilter?.("strategicPlanId") ?? null;
      } catch {}
    }

    const positionId = resolveCurrentPositionId();

    if (planId && positionId) {
      qc.invalidateQueries({
        queryKey: QKEY.strategicProjectsDashboard(planId, positionId),
      });
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          // Al cerrar la modal → refresca el listado detrás
          invalidateProjectsList();
          onClose();
        } else {
          // Si llegas a abrir/cerrar desde el trigger, mantén el comportamiento
        }
      }}
    >
      {/* relative para overlay */}
      <DialogContent className="w-[80vw] !max-w-[80vw] p-0 overflow-hidden">
        <div className="relative">
          <DialogTitle className="px-5 pt-5 pb-0 text-lg font-semibold text-gray-900">
            Factores Clave de Éxito y Tareas
          </DialogTitle>
          <p className="px-5 text-sm text-gray-600 -mt-1 mb-2">{projectName}</p>

          <div className="flex flex-col h-[85vh]">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <Button
                variant="outline"
                className="gap-2"
                onClick={toggleExpandAll}
                disabled={blocking.open}
              >
                {factors.length > 0 &&
                factors.every((f) => expandedMap[f.id]) ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Colapsar todo
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Expandir todo
                  </>
                )}
              </Button>

              {permissions.factorsCreate && (
                <Button
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={startCreateFactor}
                  disabled={blocking.open}
                >
                  + Nuevo Factor
                </Button>
              )}
            </div>

            <PlanRangeProvider
              planFromAt={projectFromAt}
              planUntilAt={projectUntilAt}
            >
              <div className="flex-1 overflow-auto bg-white p-5">
                {permissions.factorsRead ? (
                <HierarchicalTable
                  factors={factors}
                  loading={loading}
                  expandedMap={expandedMap}
                  editingFactorId={editingFactorId}
                  editingTaskByFactor={editingTaskByFactor}
                  toggleExpandFactor={(id) => toggleExpandFactor(String(id))}
                  /* FACTORES */
                  editFactor={(row) => editFactor(factors[row - 1]?.id!)}
                  saveFactor={(f) => saveFactor(f)}
                  cancelFactor={(row) => cancelFactor(factors[row - 1]?.id!)}
                  deleteFactor={(row) => deleteFactor(factors[row - 1]?.id!)}
                  reorderFactors={handleReorderFactors}
                  /* TAREAS */
                  addTask={(row) => {
                    const f = factors[row - 1];
                    if (f?.id) startCreateTask(f.id);
                  }}
                  editTask={(row, taskRow) => {
                    const f = factors[row - 1];
                    const t = f?.tasks?.[taskRow - 1];
                    if (f?.id && t?.id) editTask(f.id, t.id);
                  }}
                  saveTask={(row, t) => {
                    const f = factors[row - 1];
                    if (f?.id) saveTask(f.id, t);
                  }}
                  cancelTask={(row, taskRow) => {
                    const f = factors[row - 1];
                    const t = f?.tasks?.[taskRow - 1];
                    if (f?.id && t?.id) cancelTask(f.id, t.id);
                  }}
                  deleteTask={(row, taskRow) => {
                    const f = factors[row - 1];
                    const t = f?.tasks?.[taskRow - 1];
                    if (t?.id) deleteTask(t.id);
                  }}
                  reorderTasks={(row, next) => {
                    const f = factors[row - 1];
                    if (f?.id) handleReorderTasks(f.id, next);
                  }}
                  countCompletedTasks={(tasks) =>
                    (tasks ?? []).filter(
                      (t) =>
                        !!t.finishedAt ||
                        (t.status ?? "").toUpperCase() === "CLO"
                    ).length
                  }
                  hasItemInCreation={() => false}
                  dragDisabled={dragDisabled}
                  dragDisabledReason={dragDisabledReason}
                  permissions={permissions}
                />
                ) : (
                  <div className="text-center text-gray-500 py-10">
                    No tienes permisos para ver los factores.
                  </div>
                )}
              </div>
            </PlanRangeProvider>
          </div>

          {/* 🆕 Overlay bloqueante y con porcentaje */}
          <BlockingProgressOverlay
            open={blocking.open || isPending}
            label={
              blocking.open ? blocking.label : "Cargando factores y tareas…"
            }
            progress={blocking.open ? blocking.progress : 60}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
