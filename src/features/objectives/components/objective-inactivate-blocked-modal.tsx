"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

import ObjectiveSelect from "@/shared/components/objective-select";
import { useUpdatePriority } from "@/features/priorities/hooks/use-priorities";
import { getHumanErrorMessage } from "@/shared/api/response";
import { updateStrategicProject } from "@/features/strategic-plans/services/strategicProjectsService";

/* ====== types ====== */
type AssocItem = { id: string; name: string };
type PositionOpt = { id: string; name: string };
type PriorityRow = AssocItem & { draftObjectiveId?: string };
type PrioritiesByPositionItem = {
  positionId: string;
  positionName: string;
  priorities: AssocItem[];
};
type LocalGroup = {
  positionId: string;
  positionName: string;
  items: PriorityRow[];
};

/* ====== helpers ====== */
function shallowEqualGroups(a: LocalGroup[], b: LocalGroup[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].positionId !== b[i].positionId) return false;
    if (a[i].items.length !== b[i].items.length) return false;
    for (let j = 0; j < a[i].items.length; j++)
      if (a[i].items[j].id !== b[i].items[j].id) return false;
  }
  return true;
}
function normalizeToGroups(
  pb?: PrioritiesByPositionItem[],
  p?: AssocItem[]
): LocalGroup[] {
  if (pb?.length)
    return pb.map((g) => ({
      positionId: g.positionId,
      positionName: g.positionName,
      items: (g.priorities ?? []).map((it) => ({ ...it })),
    }));
  if (p?.length)
    return [
      {
        positionId: "unknown",
        positionName: "Sin posición",
        items: p.map((it) => ({ ...it })),
      },
    ];
  return [];
}
function toGroupedPayload(groups: LocalGroup[]): PrioritiesByPositionItem[] {
  return groups.map((g) => ({
    positionId: g.positionId,
    positionName: g.positionName,
    priorities: g.items.map((p) => ({ id: p.id, name: p.name })),
  }));
}

/* ====== componente ====== */
export function ObjectiveInactivateBlockedModal({
  open,
  message,
  projects = [],
  prioritiesByPosition = [],
  priorities = [],
  onClose,
  strategicPlanId,
  positionId,
  year,
  otherPositions,
  onListChanged,
}: {
  open: boolean;
  message?: string;
  projects?: AssocItem[];
  prioritiesByPosition?: PrioritiesByPositionItem[];
  priorities?: AssocItem[];
  onClose: () => void;
  strategicPlanId?: string;
  positionId?: string;
  year?: number;
  otherPositions?: PositionOpt[];
  onListChanged?: (next: {
    projects: AssocItem[];
    prioritiesByPosition: PrioritiesByPositionItem[];
  }) => void;
}) {
  const [groups, setGroups] = useState<LocalGroup[]>([]);
  const updateMut = useUpdatePriority(); // para prioridades
  // Estado local para PROYECTOS (mismo shape básico + draftObjectiveId)
  const [projectRows, setProjectRows] = useState<PriorityRow[]>([]);
  const [savingProjectId, setSavingProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const next = normalizeToGroups(prioritiesByPosition, priorities);
    setGroups((prev) => (shallowEqualGroups(prev, next) ? prev : next));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prioritiesByPosition, priorities]);

  // Hidratar proyectos en una lista editable local (con guard de igualdad)
  useEffect(() => {
    if (!open) return;
    const next = (projects ?? []).map((p) => ({ ...p }));
    setProjectRows((prev) =>
      prev.length === next.length && prev.every((x, i) => x.id === next[i].id)
        ? prev
        : next
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projects]);

  const canUseSelector = !!strategicPlanId && !!positionId;
  const totalPriorities = groups.reduce((acc, g) => acc + g.items.length, 0);

  // ====== PRIORIDADES: confirmar / cancelar ======
  const confirmChange = (groupIdx: number, row: PriorityRow) => {
    if (!canUseSelector)
      return toast.error("Faltan parámetros de contexto (plan/posición).");
    if (!row.draftObjectiveId) return;
    updateMut.mutate(
      {
        id: row.id,
        payload: { positionId, objectiveId: row.draftObjectiveId },
      },
      {
        onSuccess: () => {
          toast.success("Prioridad actualizada");
          setGroups((prev) => {
            const copy = prev.map((g) => ({ ...g, items: [...g.items] }));
            copy[groupIdx].items = copy[groupIdx].items.filter(
              (it) => it.id !== row.id
            );
            const cleaned = copy.filter((g) => g.items.length > 0);
            onListChanged?.({
              projects: (projectRows ?? []).map(({ id, name }) => ({
                id,
                name,
              })),
              prioritiesByPosition: toGroupedPayload(cleaned),
            });
            return cleaned;
          });
        },
        onError: (e) => toast.error(getHumanErrorMessage(e)),
      }
    );
  };

  const cancelChange = (groupIdx: number, rowId: string) => {
    setGroups((prev) =>
      prev.map((g, idx) =>
        idx !== groupIdx
          ? g
          : {
              ...g,
              items: g.items.map((it) =>
                it.id === rowId ? { ...it, draftObjectiveId: undefined } : it
              ),
            }
      )
    );
  };

  // ====== PROYECTOS: confirmar / cancelar ======
  const confirmChangeProject = (row: PriorityRow) => {
    if (!canUseSelector)
      return toast.error("Faltan parámetros de contexto (plan/posición).");
    if (!row.draftObjectiveId) return;

    setSavingProjectId(row.id);
    updateStrategicProject(row.id, {
      positionId, // NO terceros en proyectos
      objectiveId: row.draftObjectiveId,
    })
      .then(() => {
        toast.success("Proyecto actualizado");
        setProjectRows((prev) => {
          const next = prev.filter((p) => p.id !== row.id);
          onListChanged?.({
            projects: next.map(({ id, name }) => ({ id, name })),
            prioritiesByPosition: toGroupedPayload(groups),
          });
          return next;
        });
      })
      .catch((e) => toast.error(getHumanErrorMessage(e)))
      .finally(() => setSavingProjectId(null));
  };

  const cancelChangeProject = (rowId: string) => {
    setProjectRows((prev) =>
      prev.map((p) =>
        p.id === rowId ? { ...p, draftObjectiveId: undefined } : p
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="
    w-full
    max-w-[96vw] sm:max-w-[96vw] md:max-w-[90vw] lg:max-w-[80vw] xl:max-w-[1100px]
    max-h-[85vh]
    overflow-y-auto overflow-x-hidden
    box-border
  "
      >
        <DialogTitle>Asociaciones bloqueantes</DialogTitle>
        <DialogDescription>
          {message ?? "Este objetivo tiene asociaciones activas."}
        </DialogDescription>

        <Accordion type="multiple" className="mt-4 space-y-4">
          {/* === PROYECTOS === */}
          <AccordionItem
            value="projects"
            className="rounded-md border overflow-hidden bg-background shadow-sm"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex w-full items-center justify-between text-sm font-medium">
                <span>Proyectos asociados</span>
                <Badge variant="secondary">{projects?.length ?? 0}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-4 py-2 text-left w-[70%]">Proyecto</th>
                      <th className="px-4 py-2 text-left w-[30%]">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(projects?.length ?? 0) > 0 ? (
                      projects!.map((p) => {
                        const current = projectRows.find((x) => x.id === p.id);
                        const hasSelection = !!current?.draftObjectiveId;
                        const disabled = savingProjectId === p.id;

                        return (
                          <tr key={p.id} className="border-t align-top">
                            <td className="px-4 py-2 whitespace-normal break-words">
                              {p.name}
                            </td>
                            <td className="px-4 py-2">
                              {/* Selector + acciones (solo objetivos de la posición) */}
                              <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2">
                                <ObjectiveSelect
                                  planId={strategicPlanId}
                                  positionId={positionId}
                                  year={year}
                                  value={current?.draftObjectiveId}
                                  onChange={(val) =>
                                    setProjectRows((prev) => {
                                      const cur = prev.find(
                                        (it) => it.id === p.id
                                      )?.draftObjectiveId;
                                      if (cur === val) return prev; // guard: evita renders innecesarios
                                      return prev.map((it) =>
                                        it.id === p.id
                                          ? {
                                              ...it,
                                              draftObjectiveId:
                                                val ?? undefined,
                                            }
                                          : it
                                      );
                                    })
                                  }
                                  hideSwitch // sin terceros en proyectos
                                  triggerClassName="w-full"
                                  disabled={disabled}
                                />
                                {hasSelection && (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="icon"
                                      className="h-8 w-8 text-green-600"
                                      variant="ghost"
                                      title="Aplicar cambio"
                                      onClick={() =>
                                        current && confirmChangeProject(current)
                                      }
                                      disabled={disabled}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      className="h-8 w-8 text-red-600"
                                      variant="ghost"
                                      title="Cancelar selección"
                                      onClick={() => cancelChangeProject(p.id)}
                                      disabled={disabled}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          className="px-4 py-3 text-muted-foreground"
                          colSpan={2}
                        >
                          Sin proyectos asociados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* === PRIORIDADES (Nivel 1) === */}
          <AccordionItem
            value="priorities"
            className="rounded-md border overflow-hidden bg-background shadow-sm"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex w-full items-center justify-between text-sm font-medium">
                <span>Prioridades asociadas</span>
                <Badge variant="secondary">{totalPriorities}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-0 pb-4">
              {/* === POSICIONES (Nivel 2) === */}
              <Accordion type="multiple" className="divide-y">
                {groups.length ? (
                  groups.map((g, gIdx) => (
                    <AccordionItem
                      key={g.positionId}
                      value={g.positionId}
                      className="border-0"
                    >
                      <AccordionTrigger className="px-4 py-3 bg-muted/30 hover:no-underline">
                        <div className="flex w-full items-center justify-between text-sm font-medium">
                          <span>{g.positionName}</span>
                          <Badge variant="secondary">{g.items.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-0 pb-4">
                        <div className="overflow-x-auto">
                          <table className="w-full table-fixed text-sm">
                            <thead className="bg-muted/40">
                              <tr>
                                <th className="px-4 py-2 text-left w-[40%]">
                                  Prioridad
                                </th>
                                <th className="px-4 py-2 text-left w-[60%]">
                                  Acciones
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {g.items.map((row) => {
                                const hasSelection = !!row.draftObjectiveId;
                                return (
                                  <tr
                                    key={row.id}
                                    className="border-t align-top"
                                  >
                                    <td className="px-4 py-2">
                                      <div className="whitespace-normal break-words">
                                        <div className="font-mono">
                                          {row.name}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-2">
                                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-2">
                                        <div className="min-w-0">
                                          <ObjectiveSelect
                                            planId={strategicPlanId}
                                            positionId={positionId}
                                            year={year}
                                            value={row.draftObjectiveId}
                                            onChange={(val) =>
                                              setGroups((prev) =>
                                                prev.map((gg, idx) =>
                                                  idx !== gIdx
                                                    ? gg
                                                    : {
                                                        ...gg,
                                                        items: gg.items.map(
                                                          (it) =>
                                                            it.id === row.id
                                                              ? {
                                                                  ...it,
                                                                  draftObjectiveId:
                                                                    val ??
                                                                    undefined,
                                                                }
                                                              : it
                                                        ),
                                                      }
                                                )
                                              )
                                            }
                                            otherPositions={otherPositions}
                                            defaultAllowThirdParty={false}
                                            triggerClassName="w-full"
                                          />
                                        </div>
                                        {hasSelection && (
                                          <div className="flex items-center gap-1">
                                            <Button
                                              size="icon"
                                              className="h-8 w-8 text-green-600"
                                              variant="ghost"
                                              title="Aplicar cambio"
                                              onClick={() =>
                                                confirmChange(gIdx, row)
                                              }
                                              disabled={updateMut.isPending}
                                            >
                                              <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              size="icon"
                                              className="h-8 w-8 text-red-600"
                                              variant="ghost"
                                              title="Cancelar selección"
                                              onClick={() =>
                                                cancelChange(gIdx, row.id)
                                              }
                                              disabled={updateMut.isPending}
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))
                ) : (
                  <div className="p-4 text-sm text-muted-foreground">
                    Sin prioridades asociadas.
                  </div>
                )}
              </Accordion>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ObjectiveInactivateBlockedModal;
