"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Priority } from "@/features/priorities/types/priority";
import {
  useCreatePriority,
  useUpdatePriority,
} from "@/features/priorities/hooks/use-priorities";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/shared/components/single-date-picker";
import { getHumanErrorMessage } from "@/shared/api/response";
import { toast } from "sonner";
import {
  Pencil,
  Check,
  X,
  Trash2,
  Calendar as CalendarIcon,
} from "lucide-react";
import ObjectiveSelect from "@/shared/components/objective-select";
import { SingleDatePicker } from "@/shared/components/date-single-picker";
import { QueryKey, useQueryClient } from "@tanstack/react-query";

import { CellWithTooltip } from "@/shared/components/cell-with-tooltip";
import { TextareaWithCounter } from "../../../shared/components/textarea-with-counter";

import { getPositionId } from "@/shared/auth/storage";
import { useAuth } from "@/features/auth/context/AuthContext";
import { hasAccess } from "@/shared/auth/access-control";

/* ------------------------------------------------------------
   Tipos y utilidades base
------------------------------------------------------------ */
type Status = "OPE" | "CLO" | "CAN";

type Draft = {
  name: string;
  description?: string;
  status?: Status;
  fromAt?: string; // YYYY-MM-DD
  untilAt?: string; // YYYY-MM-DD
  objectiveId?: string;
  finishedAt?: string; // YYYY-MM-DD
};

const EMPTY_DRAFT: Draft = {
  name: "",
  description: "",
  status: "OPE",
  fromAt: undefined,
  untilAt: undefined,
  objectiveId: "",
  finishedAt: undefined,
};

// YYYY-MM-DD (o ISO) -> Date local
function parseYmdOrIsoToLocalDate(s?: string) {
  if (!s) return undefined;
  const ymd = s.includes("T") ? s.slice(0, 10) : s;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return undefined;
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// YYYY-MM-DD -> ISO UTC 00:00:00
function ymdToIsoUtc(ymd?: string) {
  return ymd ? `${ymd}T00:00:00.000Z` : undefined;
}

// Fecha para badges en lectura
function formatDateBadge(s?: string | null) {
  const ymd = s ? (s.includes("T") ? s.slice(0, 10) : s) : undefined;
  return ymd ? dayjs(ymd).format("DD/MM/YYYY") : "-";
}

/* ------------------------------------------------------------
   Badges de estado (solo para edición/creación)
------------------------------------------------------------ */
function nextStatus(s: Status): Status {
  if (s === "OPE") return "CLO";
  if (s === "CLO") return "CAN";
  return "OPE";
}

function StatusBadge({
  value,
  editable,
  onChange,
}: {
  value: Status;
  editable?: boolean;
  onChange?: (v: Status) => void;
}) {
  const map = {
    OPE: {
      label: "En proceso",
      className: "bg-yellow-100 text-yellow-900 border border-yellow-300",
    },
    CLO: { label: "Terminado", className: "bg-green-600 text-white" },
    CAN: { label: "Anulado", className: "bg-gray-200 text-gray-700" },
  } as const;

  const { label, className } = map[value];
  return (
    <Badge
      className={className + (editable ? " cursor-pointer select-none" : "")}
      onClick={() => {
        if (!editable) return;
        onChange?.(nextStatus(value));
      }}
    >
      {label}
    </Badge>
  );
}

/* ------------------------------------------------------------
   monthlyClass → label + colores (para lectura)
------------------------------------------------------------ */
const MONTHLY_CLASS_LABEL: Record<string, string> = {
  ABIERTAS: "En proceso",
  EN_PROCESO: "En proceso",
  ANULADAS: "Anulada",
  CUMPLIDAS_A_TIEMPO: "Cumplida a tiempo",
  CUMPLIDAS_ATRASADAS_DEL_MES: "Cumplida tarde",
  CUMPLIDAS_ATRASADAS_MESES_ANTERIORES: "Cumplida tarde",
  CUMPLIDAS_DE_OTRO_MES: "Cumplida",
  NO_CUMPLIDAS_ATRASADAS_DEL_MES: "Atrasada",
  NO_CUMPLIDAS_ATRASADAS_MESES_ANTERIORES: "Muy atrasada",
  NO_CUMPLIDAS_ATRASADAS: "Atrasada",
  NO_CUMPLIDAS_MESES_ATRAS: "Muy atrasada",
};

function resolveMonthlyLabel(mc?: string): string | undefined {
  if (!mc) return;
  if (MONTHLY_CLASS_LABEL[mc]) return MONTHLY_CLASS_LABEL[mc];
  const M = mc.toUpperCase();
  if (M.includes("CUMPLIDAS") && M.includes("ATRASADAS"))
    return "Cumplida tarde";
  if (M.startsWith("NO_CUMPLIDAS")) {
    if (M.includes("MESES") || M.includes("ANTERIORES") || M.includes("ATRAS"))
      return "Muy atrasada";
    if (M.includes("DEL_MES") || M.includes("MES")) return "Atrasada";
    return "Atrasada";
  }
  return undefined;
}

const MONTHLY_LABEL_STYLE: Record<string, { bg: string; color: string }> = {
  "En proceso": { bg: "#fde047", color: "#b09c31" },
  Atrasada: { bg: "#fca5a5", color: "#dc2626" },
  "Muy atrasada": { bg: "#dc2626", color: "#ffffff" },
  "Cumplida a tiempo": { bg: "#86efac", color: "#16a34a" },
  "Cumplida tarde": { bg: "#16a34a", color: "#ffffff" },
  Anulada: { bg: "#d1d5db", color: "#000000" },
};

function resolveMonthlyStyle(
  mc?: string
): { backgroundColor: string; color: string } | undefined {
  const label = resolveMonthlyLabel(mc);
  if (!label) return;
  const s = MONTHLY_LABEL_STYLE[label];
  if (!s) return;
  return { backgroundColor: s.bg, color: s.color };
}

function renderClosureBadge(p: Priority) {
  const finished = p.finishedAt ?? undefined;
  const canceled = p.canceledAt ?? undefined;

  if (!finished && !canceled) return null;

  let showFinished = Boolean(finished);
  let showCanceled = Boolean(canceled);
  if (finished && canceled) {
    if (p.status === "CLO") {
      showFinished = true;
      showCanceled = false;
    } else if (p.status === "CAN") {
      showFinished = false;
      showCanceled = true;
    } else {
      showFinished = true;
      showCanceled = false;
    }
  }

  return (
    <div className="flex items-center gap-2 justify-center">
      {showFinished && (
        <Badge variant="outline">{formatDateBadge(finished)}</Badge>
      )}
      {showCanceled && (
        <Badge variant="outline">{formatDateBadge(canceled)}</Badge>
      )}
    </div>
  );
}

/* ------------------------------------------------------------
   Celdas de fechas (edición)
------------------------------------------------------------ */
function DatesCell({
  fromAt,
  untilAt,
  onChange,
  editable,
}: {
  fromAt?: string;
  untilAt?: string;
  onChange?: (f?: string, u?: string) => void;
  editable?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const range: DateRange | undefined = useMemo(() => {
    if (!fromAt && !untilAt) return undefined;
    return {
      from: parseYmdOrIsoToLocalDate(fromAt),
      to: parseYmdOrIsoToLocalDate(untilAt),
    };
  }, [fromAt, untilAt]);

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline">{formatDateBadge(fromAt)}</Badge>
      <Badge variant="outline">{formatDateBadge(untilAt)}</Badge>

      {editable && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm">
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="end">
            <DateRangePicker
              date={range}
              onChange={(next) => {
                const f = next?.from
                  ? dayjs(next.from).format("YYYY-MM-DD")
                  : undefined;
                const u = next?.to
                  ? dayjs(next.to).format("YYYY-MM-DD")
                  : undefined;
                onChange?.(f, u);
              }}
              showToastOnApply={false}
              onClose={() => setOpen(false)}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

function FinishedDateCell({
  value,
  onChange,
  editable,
}: {
  value?: string; // YYYY-MM-DD
  onChange?: (v?: string) => void;
  editable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const localDate = value ? parseYmdOrIsoToLocalDate(value) : undefined;

  return (
    <div className="flex items-center gap-2 justify-center">
      <Badge variant="outline">{formatDateBadge(value)}</Badge>

      {editable && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              title="Cambiar fecha de terminado"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="end">
            <SingleDatePicker
              date={localDate}
              onChange={(date) => {
                const ymd = date ? dayjs(date).format("YYYY-MM-DD") : undefined;
                onChange?.(ymd);
              }}
              onClose={() => setOpen(false)}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

/* ------------------------------------------------------------
   Componente principal
------------------------------------------------------------ */
export default function PrioritiesTable({
  loading,
  error,
  items,
  planId,
  positionId,
  otherPositions,
  onInactivate,
  inactivatingId,
  invalidateKey,
  invalidateKeys,
  showCreateRow = false,
  onCloseCreateRow,
  onDirtyChange,
  resetSignal,
}: {
  loading?: boolean;
  error?: boolean;
  items: Priority[];
  planId?: string;
  positionId?: string;
  otherPositions?: Array<{ id: string; name: string }>;
  onInactivate?: (id: string) => void;
  inactivatingId?: string;
  invalidateKey?: readonly unknown[];
  invalidateKeys?: QueryKey[];
  showCreateRow?: boolean;
  onCloseCreateRow?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  resetSignal?: number;
}) {
  const { me } = useAuth();
  const canAssignPosition = useMemo(
    () => !!me && hasAccess(me, "positionManagement", "assign"), // ← ajusta module/action si aplica
    [me]
  );

  const createMut = useCreatePriority(invalidateKey);
  const updateMut = useUpdatePriority(invalidateKey);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [newDraft, setNewDraft] = useState<Draft>(EMPTY_DRAFT);

  const hasNewDraftValues = !!(
    newDraft.name ||
    newDraft.description ||
    newDraft.fromAt ||
    newDraft.untilAt ||
    newDraft.objectiveId ||
    newDraft.finishedAt
  );

  const isDirty =
    editingId !== null ||
    showCreateRow ||
    Object.keys(drafts).length > 0 ||
    hasNewDraftValues;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const qc = useQueryClient();

  const invalidateAll = () => {
    const keys: QueryKey[] = [
      ...(invalidateKeys ?? []),
      ...(invalidateKey ? [invalidateKey] : []),
    ];
    keys.forEach((k) =>
      qc.invalidateQueries({ queryKey: k, refetchType: "active" })
    );
  };

  const createRowRef = useRef<HTMLTableRowElement | null>(null);
  useEffect(() => {
    if (showCreateRow) {
      createRowRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [showCreateRow]);

  useEffect(() => {
    if (resetSignal === undefined) return;
    // limpiar edición/creación y borradores
    setEditingId(null);
    setDrafts({});
    setNewDraft(EMPTY_DRAFT);
    onCloseCreateRow?.();
  }, [resetSignal]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = ""; // requerido por browsers para mostrar prompt nativo
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const uiBusy =
    editingId !== null ||
    showCreateRow ||
    createMut.isPending ||
    updateMut.isPending;

  const startEdit = (p: Priority) => {
    if (uiBusy && editingId !== p.id) return;
    setEditingId(p.id);
    setDrafts((d) => ({
      ...d,
      [p.id]: {
        name: p.name,
        description: p.description ?? "",
        status: p.status,
        fromAt: p.fromAt ? p.fromAt.slice(0, 10) : undefined,
        untilAt: p.untilAt ? p.untilAt.slice(0, 10) : undefined,
        objectiveId: p.objectiveId ?? "",
        finishedAt: p.finishedAt ? p.finishedAt.slice(0, 10) : undefined,
      },
    }));
  };

  const cancelEdit = (id: string) => {
    setEditingId((prev) => (prev === id ? null : prev));
    setDrafts((d) => {
      const { [id]: _, ...rest } = d;
      return rest;
    });
  };

  const saveEdit = (id: string) => {
    const draft = drafts[id];
    if (!draft) return;

    updateMut.mutate(
      {
        id,
        payload: {
          name: draft.name,
          description: draft.description || undefined,
          status: draft.status,
          fromAt: ymdToIsoUtc(draft.fromAt),
          untilAt: ymdToIsoUtc(draft.untilAt),
          finishedAt: ymdToIsoUtc(draft.finishedAt),
          positionId,
          objectiveId: draft.objectiveId || undefined,
        },
      },
      {
        onSuccess: () => {
          invalidateAll();
          toast.success("Prioridad actualizada");
          cancelEdit(id);
        },
        onError: (e) => toast.error(getHumanErrorMessage(e)),
      }
    );
  };

  const saveNew = () => {
    if (!positionId) {
      toast.error("Selecciona una posición para crear una prioridad");
      return;
    }
    if (!newDraft.name || !newDraft.fromAt || !newDraft.untilAt) {
      toast.error("Nombre y fechas son requeridos");
      return;
    }

    createMut.mutate(
      {
        name: newDraft.name.trim(),
        description: newDraft.description || undefined,
        status: newDraft.status,
        fromAt: ymdToIsoUtc(newDraft.fromAt)!,
        untilAt: ymdToIsoUtc(newDraft.untilAt)!,
        positionId,
        objectiveId: newDraft.objectiveId || undefined,
      },
      {
        onSuccess: () => {
          invalidateAll();
          toast.success("Prioridad creada");
          setNewDraft(EMPTY_DRAFT);
          onCloseCreateRow?.();
        },
        onError: (e) => toast.error(getHumanErrorMessage(e)),
      }
    );
  };

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (error)
    return (
      <div className="text-sm text-destructive">
        No se pudo cargar la lista.
      </div>
    );

  // En edición global (cualquier fila o creación), se ocultan columnas Objetivo
  const hasEditing = editingId !== null || showCreateRow;

  // Total de columnas visibles
  //   - Visualización: #, Prioridad, Objetivo, Estado, Inicio/Fin, Fecha Terminado, Acciones => 8
  //   - Edición:       #, Prioridad, Estado, Inicio/Fin, Fecha Terminado, Acciones => 6
  const totalCols = hasEditing ? 6 : 7;

  // Colspan para la celda del editor (todas menos Acciones)
  const colsWithoutActions = totalCols - 1;

  return (
    // Permitimos scroll horizontal si hace falta, pero la tabla se ajusta al contenido
    <div className="w-full overflow-x-auto">
      <Table className="w-full table-auto">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 whitespace-nowrap">#</TableHead>

            <TableHead className="whitespace-nowrap">Prioridad</TableHead>

            {/*Objetivo en visualización */}
            {!hasEditing && (
              <TableHead className="whitespace-nowrap">Objetivo</TableHead>
            )}

            <TableHead className="text-center w-24 whitespace-nowrap">
              Estado
            </TableHead>
            <TableHead className="text-center w-40 whitespace-nowrap">
              Inicio / Fin
            </TableHead>
            <TableHead className="text-center w-40 whitespace-nowrap">
              Fecha Terminado
            </TableHead>

            {/* Acciones sticky a la derecha */}
            <TableHead className="text-center w-28 whitespace-nowrap sticky right-0 bg-background z-20 border-l">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.map((p, idx) => {
            const isEditing = editingId === p.id;
            const d = drafts[p.id];

            const monthlyLabel = resolveMonthlyLabel(p.monthlyClass);
            const monthlyStyle = resolveMonthlyStyle(p.monthlyClass);

            const effectiveStatus: Status = (d?.status ?? p.status) as Status;

            const objectiveName = p.objectiveName ?? "—";
            const deliverableText = p.description ?? "—";

            if (isEditing) {
              // --- Fila en EDICIÓN (editor en una sola celda + acciones sticky) ---
              return (
                <TableRow key={p.id}>
                  <TableCell
                    colSpan={colsWithoutActions}
                    className="align-top p-3"
                  >
                    <div className="space-y-4">
                      <div className="text-xs text-muted-foreground">
                        Editando # {idx + 1}
                      </div>

                      {/* Fila 1: Nombre, Entregable */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">
                            Nombre
                          </label>
                          <TextareaWithCounter
                            value={d?.name ?? ""}
                            onChange={(e) =>
                              setDrafts((ds) => ({
                                ...ds,
                                [p.id]: {
                                  ...(ds[p.id] ?? EMPTY_DRAFT),
                                  name: e.target.value,
                                },
                              }))
                            }
                            maxLength={120}
                            rows={2}
                            placeholder="Nombre de la prioridad"
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">
                            Entregable
                          </label>
                          <TextareaWithCounter
                            value={d?.description ?? ""}
                            onChange={(e) =>
                              setDrafts((ds) => ({
                                ...ds,
                                [p.id]: {
                                  ...(ds[p.id] ?? EMPTY_DRAFT),
                                  description: e.target.value,
                                },
                              }))
                            }
                            maxLength={500}
                            rows={3}
                            placeholder="Describe el entregable…"
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* Fila 2: Izquierda = Objetivo (mitad). Derecha = Estado / Fechas (mitad) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Izquierda: Objetivo ocupa toda la mitad (igual ancho que “Nombre”) */}
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">
                            Objetivo
                          </label>
                          <ObjectiveSelect
                            planId={planId}
                            positionId={positionId}
                            value={d?.objectiveId}
                            onChange={(val) =>
                              setDrafts((ds) => ({
                                ...ds,
                                [p.id]: {
                                  ...(ds[p.id] ?? EMPTY_DRAFT),
                                  objectiveId: val,
                                },
                              }))
                            }
                            otherPositions={otherPositions}
                          />
                        </div>

                        {/* Derecha: Estado | Fecha inicio/fin | Fecha Terminado */}
                        <div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="text-xs text-muted-foreground block mb-1">
                                Estado
                              </label>
                              <div className="h-9 flex items-center">
                                <StatusBadge
                                  value={(d?.status as Status) ?? "OPE"}
                                  editable
                                  onChange={(v) =>
                                    setDrafts((ds) => ({
                                      ...ds,
                                      [p.id]: {
                                        ...(ds[p.id] ?? EMPTY_DRAFT),
                                        status: v,
                                      },
                                    }))
                                  }
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-xs text-muted-foreground block mb-1">
                                Fecha inicio / fin
                              </label>
                              <DatesCell
                                fromAt={d?.fromAt}
                                untilAt={d?.untilAt}
                                editable
                                onChange={(f, u) =>
                                  setDrafts((ds) => ({
                                    ...ds,
                                    [p.id]: {
                                      ...(ds[p.id] ?? EMPTY_DRAFT),
                                      fromAt: f,
                                      untilAt: u,
                                    },
                                  }))
                                }
                              />
                            </div>
                            {canAssignPosition ? (
                              <div>
                                <label className="text-xs text-muted-foreground block mb-1">
                                  Fecha Terminado
                                </label>
                                {effectiveStatus === "CLO" ? (
                                  <FinishedDateCell
                                    value={d?.finishedAt}
                                    editable
                                    onChange={(v) =>
                                      setDrafts((ds) => ({
                                        ...ds,
                                        [p.id]: {
                                          ...(ds[p.id] ?? EMPTY_DRAFT),
                                          finishedAt: v,
                                        },
                                      }))
                                    }
                                  />
                                ) : (
                                  <div className="h-9 flex items-center">
                                    {renderClosureBadge(p)}
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Acciones sticky */}
                  <TableCell className="w-28 whitespace-nowrap text-right space-x-1 align-top sticky right-0 bg-background z-10 border-l">
                    <Button
                      onClick={() => saveEdit(p.id)}
                      disabled={
                        updateMut.isPending && updateMut.variables?.id === p.id
                      }
                      size="sm"
                      className="h-8 btn-gradient"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelEdit(p.id)}
                      disabled={updateMut.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            }

            // --- Fila en VISUALIZACIÓN (texto envuelve, acciones sticky) ---
            return (
              <TableRow key={p.id}>
                {/* # */}
                <TableCell className="w-12 whitespace-nowrap align-top">
                  {idx + 1}
                </TableCell>

                {/* PRIORIDAD */}
                <TableCell className="align-top">
                  <div className="max-w-full">
                    <CellWithTooltip
                      lines={[{ label: "Entregable", text: deliverableText }]}
                      side="top"
                    >
                      <div className="font-medium leading-6 break-words whitespace-pre-wrap">
                        {p.name}
                      </div>
                    </CellWithTooltip>
                  </div>
                </TableCell>

                {/*OBJETIVO solo en visualización */}
                {!hasEditing && (
                  <TableCell className="align-top">
                    <div className="text-sm break-words whitespace-pre-wrap">
                      {p.objectiveName ?? "—"}
                    </div>
                  </TableCell>
                )}

                {/* ESTADO */}
                <TableCell className="text-center w-24 whitespace-nowrap align-top">
                  <div className="flex items-center gap-2 justify-center">
                    {monthlyLabel && monthlyStyle ? (
                      <Badge
                        className="whitespace-nowrap border-0"
                        style={monthlyStyle}
                      >
                        {monthlyLabel}
                      </Badge>
                    ) : (
                      <StatusBadge value={p.status} />
                    )}
                  </div>
                </TableCell>

                {/* FECHAS (from/until) */}
                <TableCell className="text-center w-40 whitespace-nowrap align-top">
                  <div className="space-x-2 whitespace-nowrap justify-center">
                    <Badge variant="outline">{formatDateBadge(p.fromAt)}</Badge>
                    <Badge variant="outline">
                      {formatDateBadge(p.untilAt)}
                    </Badge>
                  </div>
                </TableCell>

                {/* CIERRE */}
                <TableCell className="text-center w-40 whitespace-nowrap align-top">
                  {renderClosureBadge(p)}
                </TableCell>

                {/* ACCIONES sticky */}
                <TableCell className="w-28 whitespace-nowrap text-right space-x-1 align-top sticky right-0 bg-background z-10 border-l">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(p)}
                    disabled={uiBusy}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => onInactivate?.(p.id)}
                    disabled={uiBusy || inactivatingId === p.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}

          {/* Fila de creación (misma idea: editor + acciones sticky) */}
          {showCreateRow && (
            <TableRow ref={createRowRef}>
              <TableCell colSpan={colsWithoutActions} className="align-top p-3">
                <div className="space-y-4">
                  <div className="text-xs text-muted-foreground">
                    Nueva prioridad #{items.length + 1}
                  </div>

                  {/* Fila 1: Nombre, Entregable */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">
                        Nombre
                      </label>
                      <TextareaWithCounter
                        value={newDraft.name ?? ""}
                        onChange={(e) =>
                          setNewDraft((d) => ({ ...d, name: e.target.value }))
                        }
                        maxLength={120}
                        rows={2}
                        placeholder="Nombre de la prioridad"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">
                        Entregable
                      </label>
                      <TextareaWithCounter
                        value={newDraft.description ?? ""}
                        onChange={(e) =>
                          setNewDraft((d) => ({
                            ...d,
                            description: e.target.value,
                          }))
                        }
                        maxLength={500}
                        rows={3}
                        placeholder="Describe el entregable…"
                      />
                    </div>
                  </div>

                  {/* Fila 2: Objetivo, Estado, Fecha inicio, Fecha Terminado */}
                  {/* Fila 2: Izquierda = Objetivo (mitad). Derecha = Estado / Fechas (mitad) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Izquierda: Objetivo ocupa toda la mitad (igual ancho que “Nombre”) */}
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">
                        Objetivo
                      </label>
                      <ObjectiveSelect
                        planId={planId}
                        positionId={positionId}
                        value={newDraft.objectiveId}
                        onChange={(val) =>
                          setNewDraft((d) => ({ ...d, objectiveId: val }))
                        }
                        otherPositions={otherPositions}
                        // stacked={false} (por defecto): el switch queda al lado del select
                      />
                    </div>

                    {/* Derecha: Estado | Fecha inicio/fin | Fecha Terminado (distribuidos en 3 columnas dentro de esta mitad) */}
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">
                            Estado
                          </label>
                          <div className="h-9 flex items-center">
                            <StatusBadge
                              value={(newDraft.status as Status) ?? "OPE"}
                              editable
                              onChange={(v) =>
                                setNewDraft((d) => ({ ...d, status: v }))
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">
                            Fecha inicio / fin
                          </label>
                          <DatesCell
                            fromAt={newDraft.fromAt}
                            untilAt={newDraft.untilAt}
                            editable
                            onChange={(f, u) =>
                              setNewDraft((d) => ({
                                ...d,
                                fromAt: f,
                                untilAt: u,
                              }))
                            }
                          />
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">
                            Fecha Terminado
                          </label>
                          <FinishedDateCell
                            value={newDraft.finishedAt}
                            editable
                            onChange={(v) =>
                              setNewDraft((d) => ({ ...d, finishedAt: v }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TableCell>

              {/* Acciones sticky */}
              <TableCell className="w-28 whitespace-nowrap text-right space-x-1 align-top sticky right-0 bg-background z-10 border-l">
                <Button
                  onClick={saveNew}
                  disabled={
                    !positionId || createMut.isPending || editingId !== null
                  }
                  size="sm"
                  className="h-8 btn-gradient"
                >
                  <Check className="h-4 w-4 mr-2" /> Crear
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNewDraft(EMPTY_DRAFT);
                    onCloseCreateRow?.();
                  }}
                  disabled={createMut.isPending}
                  className="h-8"
                >
                  <X className="h-4 w-4 mr-2" /> Cancelar
                </Button>
              </TableCell>
            </TableRow>
          )}

          {items.length === 0 && !showCreateRow && (
            <TableRow>
              <TableCell
                colSpan={totalCols}
                className="text-center text-sm text-muted-foreground"
              >
                No hay prioridades para los filtros seleccionados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
