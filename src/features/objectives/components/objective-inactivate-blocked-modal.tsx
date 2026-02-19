"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
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
import { Check, X, AlertTriangle, FolderKanban, ListTodo } from "lucide-react";

import ObjectiveSelect from "@/shared/components/objective-select";
import { useUpdatePriority } from "@/features/priorities/hooks/use-priorities";
import { getHumanErrorMessage } from "@/shared/api/response";
import { updateStrategicProject } from "@/features/strategic-plans/services/strategicProjectsService";
import { ConfirmModal } from "@/shared/components/confirm-modal";

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

  const [confirm, setConfirm] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({ open: false, message: "", onConfirm: () => {} });

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
  const executeChange = (groupIdx: number, row: PriorityRow) => {
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
            // Diferir el efecto secundario para evitar error de actualización durante render
            setTimeout(() => {
              onListChanged?.({
                projects: (projectRows ?? []).map(({ id, name }) => ({
                  id,
                  name,
                })),
                prioritiesByPosition: toGroupedPayload(cleaned),
              });
            }, 0);
            return cleaned;
          });
        },
        onError: (e) => toast.error(getHumanErrorMessage(e)),
      }
    );
  };

  const confirmChange = (groupIdx: number, row: PriorityRow) => {
    setConfirm({
      open: true,
      message: `¿Confirmas reasignar la prioridad "${row.name}" al nuevo objetivo?`,
      onConfirm: () => executeChange(groupIdx, row),
    });
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
  const executeChangeProject = (row: PriorityRow) => {
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
          setTimeout(() => {
            onListChanged?.({
              projects: next.map(({ id, name }) => ({ id, name })),
              prioritiesByPosition: toGroupedPayload(groups),
            });
          }, 0);
          return next;
        });
      })
      .catch((e) => toast.error(getHumanErrorMessage(e)))
      .finally(() => setSavingProjectId(null));
  };

  const confirmChangeProject = (row: PriorityRow) => {
    setConfirm({
      open: true,
      message: `¿Confirmas reasignar el proyecto "${row.name}" al nuevo objetivo?`,
      onConfirm: () => executeChangeProject(row),
    });
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
          max-w-[96vw] sm:max-w-[96vw] md:max-w-[90vw] lg:max-w-[80vw] xl:max-w-[1000px]
          max-h-[90vh]
          overflow-y-auto overflow-x-hidden
          box-border
          p-0 gap-0
        "
      >
        <DialogHeader className="p-6 pb-4 border-b bg-muted/10 flex-row items-start gap-4 space-y-0">
          <div className="p-2 bg-red-100 rounded-full shrink-0 text-red-600 mt-1">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <DialogTitle className="text-lg font-semibold">
              Acción requerida: Reasignar dependencias
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {message ??
                "Este objetivo no se puede inactivar porque tiene elementos asociados. Para continuar, reasigna los proyectos y prioridades a otro objetivo."}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <Accordion type="multiple" className="space-y-4" defaultValue={["projects", "priorities"]}>
          {/* === PROYECTOS === */}
          <AccordionItem
            value="projects"
            className="rounded-lg border overflow-hidden bg-card shadow-sm"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/5">
              <div className="flex w-full items-center gap-3 text-sm font-medium">
                <div className="p-1.5 bg-blue-100 text-blue-700 rounded-md">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left">Proyectos Estratégicos</span>
                <Badge variant="secondary">{projects?.length ?? 0}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <thead className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider font-medium border-b">
                    <tr>
                      <th className="px-5 py-3 text-left w-[60%]">Nombre del Proyecto</th>
                      <th className="px-5 py-3 text-left w-[40%]">Reasignar a</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(projects?.length ?? 0) > 0 ? (
                      projects!.map((p) => {
                        const current = projectRows.find((x) => x.id === p.id);
                        const hasSelection = !!current?.draftObjectiveId;
                        const disabled = savingProjectId === p.id;

                        return (
                          <tr key={p.id} className="group hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-3 align-top">
                              <div className="font-medium text-foreground break-words leading-snug">
                                {p.name}
                              </div>
                            </td>
                            <td className="px-5 py-3 align-top">
                              {/* Selector + acciones (solo objetivos de la posición) */}
                              <div className="flex items-center gap-2">
                                <div className="flex-1 min-w-0">
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
                                  triggerClassName="w-full h-9 text-sm"
                                  disabled={disabled}
                                />
                                </div>
                                {hasSelection && (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="icon"
                                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
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
                                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
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
                          className="px-5 py-6 text-center text-muted-foreground italic"
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
            className="rounded-lg border overflow-hidden bg-card shadow-sm"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/5">
              <div className="flex w-full items-center gap-3 text-sm font-medium">
                <div className="p-1.5 bg-amber-100 text-amber-700 rounded-md">
                  <ListTodo className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left">Prioridades asociadas</span>
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
                      <AccordionTrigger className="px-4 py-2 bg-muted/20 hover:bg-muted/30 hover:no-underline text-sm">
                        <div className="flex w-full items-center justify-between text-sm font-medium">
                          <span>{g.positionName}</span>
                          <Badge variant="secondary">{g.items.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-0 pb-4">
                        <div className="overflow-x-auto">
                          <table className="w-full table-fixed text-sm">
                            <thead className="bg-muted/10 text-muted-foreground text-xs uppercase tracking-wider font-medium border-b">
                              <tr>
                                <th className="px-5 py-2 text-left w-[50%]">
                                  Nombre de la Prioridad
                                </th>
                                <th className="px-5 py-2 text-left w-[50%]">
                                  Reasignar a
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {g.items.map((row) => {
                                const hasSelection = !!row.draftObjectiveId;
                                return (
                                  <tr
                                    key={row.id}
                                    className="group hover:bg-muted/20 transition-colors"
                                  >
                                    <td className="px-5 py-3 align-top">
                                      <div className="whitespace-normal break-words leading-snug">
                                        <div className="font-medium text-foreground">
                                          {row.name}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-5 py-3 align-top">
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 min-w-0">
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
                                            triggerClassName="w-full h-9 text-sm"
                                          />
                                        </div>
                                        {hasSelection && (
                                          <div className="flex items-center gap-1">
                                            <Button
                                              size="icon"
                                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
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
                                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
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
                  <div className="p-6 text-center text-sm text-muted-foreground italic">
                    Sin prioridades asociadas.
                  </div>
                )}
              </Accordion>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/10">
          <Button onClick={onClose} variant="outline">Cerrar</Button>
        </DialogFooter>
      </DialogContent>

      <ConfirmModal
        open={confirm.open}
        title="Confirmar reasignación"
        message={confirm.message}
        onConfirm={() => {
          setConfirm((prev) => ({ ...prev, open: false }));
          confirm.onConfirm();
        }}
        onCancel={() => setConfirm((prev) => ({ ...prev, open: false }))}
      />
    </Dialog>
  );
}

export default ObjectiveInactivateBlockedModal;
