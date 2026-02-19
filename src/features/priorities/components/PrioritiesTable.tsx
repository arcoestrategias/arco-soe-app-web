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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Priority } from "@/features/priorities/types/priority";
import {
  useCreatePriority,
  useUpdatePriority,
} from "@/features/priorities/hooks/use-priorities";
import { getHumanErrorMessage } from "@/shared/api/response";
import { toast } from "sonner";
import {
  Pencil,
  Check,
  X,
  Trash2,
  Calendar as CalendarIcon,
  StickyNote,
  Paperclip,
} from "lucide-react";
import ObjectiveSelect from "@/shared/components/objective-select";
import { SingleDatePicker } from "@/shared/components/single-date-picker";
import { QueryKey, useQueryClient } from "@tanstack/react-query";

import { CellWithTooltip } from "@/shared/components/cell-with-tooltip";
import { TextareaWithCounter } from "../../../shared/components/textarea-with-counter";

import { getPositionId } from "@/shared/auth/storage";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";
import { usePermissions } from "@/shared/auth/access-control";
import NotesModal from "@/shared/components/comments/components/notes-modal";
import { UploadFilesModal } from "@/shared/components/upload-files-modal";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { ConfirmModal } from "@/shared/components/confirm-modal";

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
  objectiveId?: string; // undefined = sin selección
  finishedAt?: string; // YYYY-MM-DD
};

const EMPTY_DRAFT: Draft = {
  name: "",
  description: "",
  status: "OPE",
  fromAt: undefined,
  untilAt: undefined,
  objectiveId: undefined,
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

const toYmd = (d?: Date) =>
  d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}`
    : undefined;

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
  CUMPLIDAS_DE_OTRO_MES: "Cumplida otro mes",
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
  "Cumplida otro mes": { bg: "#116b31", color: "#ffffff" },
};

function resolveMonthlyStyle(
  mc?: string,
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
function DateEditor({
  value,
  onChange,
  minDate,
  maxDate,
  disabled,
  placeholder = "Seleccionar",
  open,
  onOpenChange,
}: {
  value?: string;
  onChange: (val?: string) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  placeholder?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const date = parseYmdOrIsoToLocalDate(value);

  const isControlled = open !== undefined;
  const effectiveOpen = isControlled ? open : internalOpen;
  const effectiveOnOpenChange =
    isControlled && onOpenChange ? onOpenChange : setInternalOpen;

  return (
    <Popover open={effectiveOpen} onOpenChange={effectiveOnOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal px-3",
            !value && "text-muted-foreground",
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatDateBadge(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <SingleDatePicker
          date={date}
          minDate={minDate}
          maxDate={maxDate}
          onClose={() => effectiveOnOpenChange(false)}
          onApply={(d) => onChange(toYmd(d))}
        />
      </PopoverContent>
    </Popover>
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
  year,
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
  year?: number;
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
  const permissions = usePermissions({
    update: PERMISSIONS.PRIORITIES.UPDATE,
    delete: PERMISSIONS.PRIORITIES.DELETE,
    addNote: PERMISSIONS.PRIORITIES.ADD_NOTE,
    uploadDocument: PERMISSIONS.PRIORITIES.UPLOAD_DOCUMENT,
    updateFinishedAt: PERMISSIONS.PRIORITIES.UPDATE_FINISHED_AT,
    updateDateRange: PERMISSIONS.PRIORITIES.UPDATE_DATE_RANGE,
  });

  const [editFromOpen, setEditFromOpen] = useState(false);
  const [editUntilOpen, setEditUntilOpen] = useState(false);
  const [createFromOpen, setCreateFromOpen] = useState(false);
  const [createUntilOpen, setCreateUntilOpen] = useState(false);

  const createMut = useCreatePriority(invalidateKey);
  const updateMut = useUpdatePriority(invalidateKey);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [newDraft, setNewDraft] = useState<Draft>(EMPTY_DRAFT);
  const [notesFor, setNotesFor] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({ open: false, message: "", onConfirm: () => {} });

  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPE" | "CLO" | "CAN">("ALL");

  const filteredItems = useMemo(() => {
    if (statusFilter === "ALL") return items;
    return items.filter((i) => i.status === statusFilter);
  }, [items, statusFilter]);

  const [docsFor, setDocsFor] = useState<{
    open: boolean;
    id?: string;
    name?: string | null;
  }>({
    open: false,
    id: undefined,
    name: null,
  });
  const openDocs = (id: string, name?: string | null) =>
    setDocsFor({ open: true, id, name: name ?? null });
  const closeDocs = () =>
    setDocsFor({ open: false, id: undefined, name: null });

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
      qc.invalidateQueries({ queryKey: k, refetchType: "active" }),
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
    setEditFromOpen(false);
    setEditUntilOpen(false);
  }, [editingId]);

  useEffect(() => {
    setCreateFromOpen(false);
    setCreateUntilOpen(false);
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
        objectiveId: p.objectiveId || undefined,
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
      },
    );
  };

  const saveNew = () => {
    if (!positionId) {
      toast.error("Selecciona una posición para crear una prioridad");
      return;
    }
    if (!newDraft.name) {
      toast.error("El nombre es requerido");
      return;
    }
    if (!newDraft.fromAt || !newDraft.untilAt) {
      toast.error("Las fechas de inicio y fin son requeridas");
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
        finishedAt: ymdToIsoUtc(newDraft.finishedAt),
      },
      {
        onSuccess: () => {
          invalidateAll();
          toast.success("Prioridad creada");
          setNewDraft(EMPTY_DRAFT);
          onCloseCreateRow?.();
        },
        onError: (e) => toast.error(getHumanErrorMessage(e)),
      },
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as any)}
        >
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="Filtrar estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="OPE">En proceso</SelectItem>
            <SelectItem value="CLO">Terminado</SelectItem>
            <SelectItem value="CAN">Anulado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Permitimos scroll horizontal si hace falta, pero la tabla se ajusta al contenido */}
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
              <TableHead className="text-center w-36 whitespace-nowrap sticky right-0 bg-background z-20 border-l">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredItems.map((p, idx) => {
              const isEditing = editingId === p.id;
              const d = drafts[p.id];

              const monthlyLabel = resolveMonthlyLabel(p.monthlyClass);
              const monthlyStyle = resolveMonthlyStyle(p.monthlyClass);

              const effectiveStatus: Status = (d?.status ?? p.status) as Status;

              const objectiveName = p.objectiveName ?? "-";
              const deliverableText = p.description ?? "-";

              if (isEditing && d) {
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
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-4">
                          <Label className="text-xs text-muted-foreground block mb-1">
                            Nombre
                          </Label>
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
                            maxLength={500}
                            rows={2}
                            placeholder="Nombre de la prioridad"
                            className="w-full"
                          />
                        </div>

                        <div className="md:col-span-8">
                          <Label className="text-xs text-muted-foreground block mb-1">
                            Entregable
                          </Label>
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
                            maxLength={1000}
                            rows={3}
                            placeholder="Describe el entregable…"
                            className="w-full"
                          />
                        </div>

                        {/* Fila 2: Objetivo, Estado, Fechas */}
                        <div className="md:col-span-4">
                          <Label className="text-xs text-muted-foreground block mb-1">
                            Objetivo
                          </Label>
                          <ObjectiveSelect
                            planId={planId}
                            positionId={positionId}
                            year={year}
                            value={d.objectiveId}
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
                            stacked
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label className="text-xs text-muted-foreground block mb-1">
                            Estado
                          </Label>
                          <Select
                            value={effectiveStatus}
                            onValueChange={(v) =>
                              setDrafts((ds) => {
                                const s = v as Status;
                                const current = ds[p.id] ?? EMPTY_DRAFT;
                                let finishedAt = current.finishedAt;
                                if (s === "CLO" && !finishedAt) {
                                  finishedAt = dayjs().format("YYYY-MM-DD");
                                }
                                return {
                                  ...ds,
                                  [p.id]: {
                                    ...current,
                                    status: s,
                                    finishedAt,
                                  },
                                };
                              })
                            }
                          >
                            <SelectTrigger className="w-full h-9">
                              <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OPE">En proceso</SelectItem>
                              <SelectItem value="CLO">Terminado</SelectItem>
                              <SelectItem value="CAN">Anulado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="md:col-span-2">
                          <Label className="text-xs text-muted-foreground block mb-1">
                            Desde
                          </Label>
                          <DateEditor
                            value={d?.fromAt}
                            disabled={!permissions.updateDateRange}
                            open={editFromOpen}
                            onOpenChange={setEditFromOpen}
                            onChange={(val) => {
                              setDrafts((ds) => ({
                                ...ds,
                                [p.id]: {
                                  ...(ds[p.id] ?? EMPTY_DRAFT),
                                  fromAt: val,
                                },
                              }));
                              if (val) setEditUntilOpen(true);
                            }}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label className="text-xs text-muted-foreground block mb-1">
                            Hasta
                          </Label>
                          <DateEditor
                            value={d?.untilAt}
                            minDate={parseYmdOrIsoToLocalDate(d?.fromAt)}
                            disabled={!permissions.updateDateRange}
                            open={editUntilOpen}
                            onOpenChange={setEditUntilOpen}
                            onChange={(val) =>
                              setDrafts((ds) => ({
                                ...ds,
                                [p.id]: {
                                  ...(ds[p.id] ?? EMPTY_DRAFT),
                                  untilAt: val,
                                },
                              }))
                            }
                          />
                        </div>

                        {permissions.updateFinishedAt &&
                          effectiveStatus === "CLO" && (
                            <div className="md:col-span-2">
                              <Label className="text-xs text-muted-foreground block mb-1">
                                Terminado
                              </Label>
                              <DateEditor
                                value={d?.finishedAt}
                                onChange={(val) =>
                                  setDrafts((ds) => ({
                                    ...ds,
                                    [p.id]: {
                                      ...(ds[p.id] ?? EMPTY_DRAFT),
                                      finishedAt: val,
                                    },
                                  }))
                                }
                              />
                            </div>
                          )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Acciones sticky */}
                  <TableCell className="w-36 whitespace-nowrap text-right space-x-1 align-top sticky right-0 bg-background z-10 border-l">
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
                      {p.objectiveName ?? "-"}
                    </div>
                  </TableCell>
                )}

                {/* ESTADO */}
                <TableCell className="text-center w-24 whitespace-nowrap align-top">
                  <div className="flex items-center gap-2 justify-center">
                    {monthlyLabel ? (
                      <Badge
                        className="whitespace-nowrap border-0"
                        style={monthlyStyle ?? {}}
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
                <TableCell className="w-36 whitespace-nowrap text-right space-x-1 align-top sticky right-0 bg-background z-10 border-l">
                  {permissions.update && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(p)}
                      disabled={uiBusy}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {permissions.addNote && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Notas"
                      onClick={() => setNotesFor(p.id)}
                      disabled={uiBusy}
                    >
                      <StickyNote className="h-4 w-4" />
                    </Button>
                  )}
                  {permissions.uploadDocument && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Documentos"
                      onClick={() => openDocs(p.id, p.name)}
                      disabled={uiBusy}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  )}
                  {permissions.delete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() =>
                        setConfirm({
                          open: true,
                          message: `¿Estás seguro de que deseas eliminar la prioridad "${p.name}"?`,
                          onConfirm: () => onInactivate?.(p.id),
                        })
                      }
                      disabled={uiBusy || inactivatingId === p.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
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
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-4">
                      <Label className="text-xs text-muted-foreground block mb-1">
                        Nombre
                      </Label>
                      <TextareaWithCounter
                        value={newDraft.name ?? ""}
                        onChange={(e) =>
                          setNewDraft((d) => ({ ...d, name: e.target.value }))
                        }
                        maxLength={500}
                        rows={2}
                        placeholder="Nombre de la prioridad"
                        className="w-full"
                      />
                    </div>

                    <div className="md:col-span-8">
                      <Label className="text-xs text-muted-foreground block mb-1">
                        Entregable
                      </Label>
                      <TextareaWithCounter
                        value={newDraft.description ?? ""}
                        onChange={(e) =>
                          setNewDraft((d) => ({
                            ...d,
                            description: e.target.value,
                          }))
                        }
                        maxLength={1000}
                        rows={3}
                        placeholder="Describe el entregable…"
                      />
                    </div>

                    {/* Fila 2: Objetivo, Estado, Fechas */}
                    <div className="md:col-span-4">
                      <Label className="text-xs text-muted-foreground block mb-1">
                        Objetivo
                      </Label>
                      <ObjectiveSelect
                        planId={planId}
                        positionId={positionId}
                        year={year}
                        value={newDraft.objectiveId}
                        onChange={(val) =>
                          setNewDraft((d) => ({ ...d, objectiveId: val }))
                        }
                        otherPositions={otherPositions}
                        stacked
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label className="text-xs text-muted-foreground block mb-1">
                        Estado
                      </Label>
                      <Select
                        value={newDraft.status ?? "OPE"}
                        onValueChange={(v) =>
                          setNewDraft((d) => {
                            const s = v as Status;
                            let finishedAt = d.finishedAt;
                            if (s === "CLO" && !finishedAt) {
                              finishedAt = dayjs().format("YYYY-MM-DD");
                            }
                            return { ...d, status: s, finishedAt };
                          })
                        }
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPE">En proceso</SelectItem>
                          <SelectItem value="CLO">Terminado</SelectItem>
                          <SelectItem value="CAN">Anulado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <Label className="text-xs text-muted-foreground block mb-1">
                        Desde
                      </Label>
                      <DateEditor
                        value={newDraft.fromAt}
                        open={createFromOpen}
                        onOpenChange={setCreateFromOpen}
                        onChange={(val) => {
                          setNewDraft((d) => ({ ...d, fromAt: val }));
                          if (val) setCreateUntilOpen(true);
                        }}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label className="text-xs text-muted-foreground block mb-1">
                        Hasta
                      </Label>
                      <DateEditor
                        value={newDraft.untilAt}
                        minDate={parseYmdOrIsoToLocalDate(newDraft.fromAt)}
                        open={createUntilOpen}
                        onOpenChange={setCreateUntilOpen}
                        onChange={(val) =>
                          setNewDraft((d) => ({ ...d, untilAt: val }))
                        }
                      />
                    </div>

                    {permissions.updateFinishedAt && newDraft.status === "CLO" && (
                      <div className="md:col-span-2">
                        <Label className="text-xs text-muted-foreground block mb-1">
                          Terminado
                        </Label>
                        <DateEditor
                          value={newDraft.finishedAt}
                          onChange={(val) =>
                            setNewDraft((d) => ({ ...d, finishedAt: val }))
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>

              {/* Acciones sticky */}
              <TableCell className="w-36 whitespace-nowrap text-right space-x-1 align-top sticky right-0 bg-background z-10 border-l">
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

          {filteredItems.length === 0 && !showCreateRow && (
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

      <NotesModal
        isOpen={!!notesFor}
        onClose={() => setNotesFor(null)}
        referenceId={notesFor ?? ""}
      />

      <UploadFilesModal
        open={docsFor.open}
        onClose={closeDocs}
        referenceId={docsFor.id ?? ""}
        type="document"
        title={`Documentos de ${docsFor.name ?? "esta prioridad"}`}
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
