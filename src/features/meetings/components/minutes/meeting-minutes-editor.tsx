"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import dayjs from "dayjs";
import { toast } from "sonner";
import {
  Loader2,
  FileText,
  Save,
  RefreshCw,
  Plus,
  Trash,
  Check,
  X,
  Upload,
  ChevronDown,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CellWithTooltip } from "@/shared/components/cell-with-tooltip";
import { TextareaWithCounter } from "@/shared/components/textarea-with-counter";
import { SingleDatePicker } from "@/shared/components/single-date-picker";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { UploadFilesModal } from "@/shared/components/upload-files-modal";
import { getMinutesVersions } from "../../services/meetingsService";
import {
  useMeetingMinutesQuery,
  useCreateMinutesMutation,
  useUpdateMinutesMutation,
  useFinalizeMinutesMutation,
  useCreatePriorityMutation,
  useParticipantsPerformanceQuery,
} from "../../hooks/use-meeting-minutes";
import { useMeetingByIdQuery } from "../../hooks/use-meetings";
import { StrategicPlanSelect } from "@/shared/filters/components/StrategicPlanSelect";
import { getBusinessUnitId } from "@/shared/auth/storage";
import { getStrategicPlansByBusinessUnit } from "@/features/strategic-plans/services/strategicPlansService";
import ObjectiveSelect from "@/shared/components/objective-select";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useAnyPermission } from "@/shared/auth/access-control";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";
import { cn } from "@/lib/utils";
import type {
  MeetingMinutesData,
  MinutesResponse,
  MinutesPosition,
  MinutesAttendance,
  MinutesPrioritySnapshot,
} from "../../types/meeting-minutes.types";

// ---- Helpers visuales (mismos que PrioritiesTable) ----
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

function formatDateBadge(s?: string | null) {
  const ymd = s ? (s.includes("T") ? s.slice(0, 10) : s) : undefined;
  return ymd ? dayjs(ymd).format("DD/MM/YYYY") : "-";
}

// ---- Helpers de fechas (mismos que PrioritiesTable) ----
function parseYmdOrIsoToLocalDate(s?: string) {
  if (!s) return undefined;
  const ymd = s.includes("T") ? s.slice(0, 10) : s;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return undefined;
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toYmd(d?: Date) {
  return d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    : undefined;
}

// ---- DateEditor (mismo que PrioritiesTable) ----
function DateEditor({
  value,
  onChange,
  minDate,
  disabled,
  placeholder = "Seleccionar",
  open,
  onOpenChange,
}: {
  value?: string;
  onChange: (val?: string) => void;
  minDate?: Date;
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
          onClose={() => effectiveOnOpenChange(false)}
          onApply={(d) => onChange(toYmd(d))}
        />
      </PopoverContent>
    </Popover>
  );
}

interface Props {
  meetingId: string;
  onBack: () => void;
  initialMinutesId?: string;
}

export default function MeetingMinutesEditor({ meetingId, onBack }: Props) {
  // Data
  const { data: meeting } = useMeetingByIdQuery(meetingId);
  const { data: minutes, isLoading } = useMeetingMinutesQuery(meetingId);
  const { data: participants } = useParticipantsPerformanceQuery(meetingId);
  const { data: plans = [] } = useQuery({
    queryKey: QKEY.strategicPlansByBU(getBusinessUnitId() ?? ""),
    queryFn: () => getStrategicPlansByBusinessUnit(getBusinessUnitId()!),
    enabled: !!getBusinessUnitId(),
  });

  const { data: versions = [] } = useQuery({
    queryKey: [...QKEY.meetingMinutes(meetingId), "versions"],
    queryFn: () => getMinutesVersions(meetingId),
    enabled: !!meetingId,
  });

  const createMinutesMut = useCreateMinutesMutation(meetingId);
  const updateMinutesMut = useUpdateMinutesMutation(meetingId);
  const finalizeMut = useFinalizeMinutesMutation(meetingId);
  const createPriorityMut = useCreatePriorityMutation(meetingId);
  const { me } = useAuth();
  const canCreatePriorityAny = useAnyPermission([
    PERMISSIONS.MEETINGS.MANAGE,
    PERMISSIONS.MEETINGS.CREATE_PRIORITY,
  ]);

  const [data, setData] = useState<MeetingMinutesData | null>(null);
  const [minutesId, setMinutesId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("DRAFT");
  const [version, setVersion] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [createModalPositionId, setCreateModalPositionId] = useState<string | null>(null);
  const [createFromOpen, setCreateFromOpen] = useState(false);
  const [createUntilOpen, setCreateUntilOpen] = useState(false);
  useEffect(() => {
    setCreateFromOpen(false);
    setCreateUntilOpen(false);
  }, [createModalPositionId]);

  const otherPositions = useMemo(
    () =>
      data?.positions
        ?.filter((p) => p.positionId !== createModalPositionId)
        ?.map((p) => ({ id: p.positionId, name: p.positionName })) ?? [],
    [data, createModalPositionId],
  );

  const [newCommitment, setNewCommitment] = useState<
    Record<
      string,
      {
        name: string;
        description: string;
        status: string;
        fromAt: string;
        untilAt: string;
        objectiveId: string;
        finishedAt: string;
      }
    >
  >({});
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(
    new Set(),
  );
  const [hasAutoFetched, setHasAutoFetched] = useState(false);
  const [strategicPlanId, setStrategicPlanId] = useState<string | null>(null);
  const initialized = useRef(false);
  const lastFetchedPlan = useRef<string | null>(null);

  // Restore strategicPlanId from localStorage or auto-select first available
  useEffect(() => {
    const saved = localStorage.getItem("selectedPlanId");
    if (saved) {
      setStrategicPlanId(saved);
    } else if (plans.length === 1) {
      const id = plans[0].id;
      setStrategicPlanId(id);
      try {
        localStorage.setItem("selectedPlanId", id);
      } catch {
        /* ignore */
      }
    }
  }, [plans]);

  // Expand first position when data loads
  useEffect(() => {
    if (
      data?.positions &&
      expandedPositions.size === 0 &&
      data.positions.length > 0
    ) {
      setExpandedPositions(new Set([data.positions[0].positionId]));
    }
  }, [data]);

  // Auto-cargar datos si las posiciones están vacías
  useEffect(() => {
    if (!data || !minutesId || hasAutoFetched || data.finalizedAt) return;
    const hasEmptyPerformance = data.positions.some(
      (p) => p.performance === null,
    );
    if (hasEmptyPerformance) {
      setHasAutoFetched(true);
      fetchAndSaveLiveData(data);
    }
  }, [data?.positions?.length]);

  // Re-fetch when strategicPlanId changes or data becomes available with a plan
  useEffect(() => {
    if (
      data &&
      strategicPlanId &&
      lastFetchedPlan.current !== strategicPlanId
    ) {
      lastFetchedPlan.current = strategicPlanId;
      fetchAndSaveLiveData(data);
    }
  }, [strategicPlanId, data]);

  const togglePosition = (positionId: string) => {
    setExpandedPositions((prev) => {
      const next = new Set(prev);
      if (next.has(positionId)) {
        next.delete(positionId);
      } else {
        next.add(positionId);
      }
      return next;
    });
  };

  // Load existing minutes (only once)
  useEffect(() => {
    if (minutes && !initialized.current) {
      setData(minutes.data);
      setMinutesId(minutes.id);
      setStatus(minutes.status);
      setVersion(minutes.version);
      initialized.current = true;
    }
  }, [minutes]);

  const isDraft = status === "DRAFT";
  const isFinalized = status === "FINALIZED";

  const canCreate =
    isDraft &&
    (canCreatePriorityAny ||
      meeting?.createdBy === me?.id ||
      meeting?.participants?.some(
        (p: any) => p.role === "CONVENER" && p.userId === me?.id,
      ));

  const handleCreate = async () => {
    try {
      const result = await createMinutesMut.mutateAsync(
        meeting?.agenda ?? undefined,
      );
      setData(result.data);
      setMinutesId(result.id);
      setStatus(result.status);
      setVersion(result.version);
      initialized.current = true;
      toast.success("Borrador de acta creado");
    } catch {
      toast.error("Error al crear acta");
    }
  };

  const handleCreateNewVersion = async () => {
    try {
      const result = await createMinutesMut.mutateAsync(
        meeting?.agenda ?? undefined,
      );
      setData(result.data);
      setMinutesId(result.id);
      setStatus(result.status);
      setVersion(result.version);
      initialized.current = false;
      toast.success("Nueva versión creada");
    } catch {
      toast.error("Error al crear nueva versión");
    }
  };

  function getMonthRange() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    return { currentMonth, currentYear, nextMonth, nextYear };
  }

  function priorityInMonth(pr: MinutesPrioritySnapshot, month: number, year: number): boolean {
    if (!pr.untilAt) return false;
    const d = new Date(pr.untilAt);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  }

  function mapPriority(pr: any) {
    return {
      id: pr.id,
      name: pr.name,
      description: pr.description,
      status: pr.status,
      monthlyClass: pr.monthlyClass,
      untilAt: pr.untilAt?.slice(0, 10),
      finishedAt: pr.finishedAt?.slice(0, 10),
      canceledAt: pr.canceledAt?.slice(0, 10),
      fromAt: pr.fromAt?.slice(0, 10),
      createdAt: pr.createdAt,
      objectiveName: pr.objectiveName,
    };
  }

  function computeMonthlyClass(pr: { status: string; untilAt?: string }): string | undefined {
    if (pr.status !== 'OPE' || !pr.untilAt) return undefined;
    const { currentMonth, currentYear } = getMonthRange();
    const d = new Date(pr.untilAt);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    if (y < currentYear || (y === currentYear && m < currentMonth)) {
      return 'NO_CUMPLIDAS_ATRASADAS_MESES_ANTERIORES';
    }
    return undefined;
  }

  const fetchAndSaveLiveData = async (currentData: MeetingMinutesData) => {
    try {
      const { getPositionsOverview } =
        await import("@/features/positions/services/positionsService");
      const { prioritiesService } =
        await import("@/features/priorities/services/prioritiesService");
      const { currentMonth, currentYear, nextMonth, nextYear } = getMonthRange();

      const updated = {
        ...currentData,
        positions: await Promise.all(
          currentData.positions.map(async (pos) => {
            if (!pos.positionId) return pos;
            try {
              const overviewPromise =
                getBusinessUnitId() && strategicPlanId
                  ? getPositionsOverview({
                      positionId: pos.positionId,
                      businessUnitId: getBusinessUnitId()!,
                      strategicPlanId,
                      month: currentMonth,
                      year: currentYear,
                    }).catch(() => null)
                  : Promise.resolve(null);

              const [currentRes, nextRes] = await Promise.all([
                prioritiesService.getPriorities({
                  positionId: pos.positionId,
                  month: currentMonth,
                  year: currentYear,
                  page: 1,
                  limit: 1000,
                }).catch(() => null),
                prioritiesService.getPriorities({
                  positionId: pos.positionId,
                  month: nextMonth,
                  year: nextYear,
                  page: 1,
                  limit: 1000,
                }).catch(() => null),
              ]);

              const [overview] = await Promise.all([overviewPromise]);
              const item = overview?.listPositions?.[0];

              const allPriorities = [
                ...(nextRes?.items ?? []),
                ...(currentRes?.items ?? []),
              ];

              return {
                ...pos,
                performance: item
                  ? {
                      ico: item.ico ?? 0,
                      icp: item.icp ?? 0,
                      performance: item.performance ?? 0,
                      avance: item.generalAverageProjects ?? 0,
                    }
                  : null,
                priorities: allPriorities.map(mapPriority),
              };
            } catch {
              return pos;
            }
          }),
        ),
      };

      await updateMinutesMut.mutateAsync(updated);
      setData(updated);
      toast.success("Datos cargados");
    } catch {
      // silently fail - user can use refresh button
    }
  };

  const handleSave = async () => {
    if (!data) return;
    setIsSaving(true);
    try {
      await updateMinutesMut.mutateAsync(data);
      toast.success("Borrador guardado");
    } catch {
      toast.error("Error al guardar");
    }
    setIsSaving(false);
  };

  const handleFinalize = async () => {
    try {
      const result = await finalizeMut.mutateAsync();
      setStatus(result.status);
      toast.success("Acta finalizada");
    } catch {
      toast.error("Error al finalizar");
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const { http } = await import("@/shared/api/http");
      const { routes } = await import("@/shared/api/routes");
      const res = await http.post<ArrayBuffer>(
        routes.meetings.minutesPdf(meetingId),
        {},
        { responseType: "arraybuffer" },
      );
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `acta-v${version}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF descargado");
    } catch {
      toast.error("Error al generar PDF");
    }
  };

  const handleRefreshPerformance = async () => {
    if (!data || !participants) return;
    toast.info("Recargando datos...");

    try {
      const { getPositionsOverview } =
        await import("@/features/positions/services/positionsService");
      const { prioritiesService } =
        await import("@/features/priorities/services/prioritiesService");
      const { currentMonth, currentYear, nextMonth, nextYear } = getMonthRange();

      const updated = { ...data, positions: [...data.positions] };
      for (let i = 0; i < updated.positions.length; i++) {
        const pos = updated.positions[i];
        if (!pos.positionId) continue;
        try {
          const overviewPromise =
            getBusinessUnitId() && strategicPlanId
              ? getPositionsOverview({
                  positionId: pos.positionId,
                  businessUnitId: getBusinessUnitId()!,
                  strategicPlanId,
                  month: currentMonth,
                  year: currentYear,
                }).catch(() => null)
              : Promise.resolve(null);

          const [currentRes, nextRes] = await Promise.all([
            prioritiesService.getPriorities({
              positionId: pos.positionId,
              month: currentMonth,
              year: currentYear,
              page: 1,
              limit: 1000,
            }).catch(() => null),
            prioritiesService.getPriorities({
              positionId: pos.positionId,
              month: nextMonth,
              year: nextYear,
              page: 1,
              limit: 1000,
            }).catch(() => null),
          ]);

          const [overview] = await Promise.all([overviewPromise]);
          const item = overview?.listPositions?.[0];

          const allPriorities = [
            ...(nextRes?.items ?? []),
            ...(currentRes?.items ?? []),
          ];

          updated.positions[i] = {
            ...pos,
            performance: item
              ? {
                  ico: item.ico ?? 0,
                  icp: item.icp ?? 0,
                  performance: item.performance ?? 0,
                  avance: item.generalAverageProjects ?? 0,
                }
              : null,
            priorities: allPriorities.map(mapPriority),
          };
        } catch {
          // position may not have data
        }
      }
      setData(updated);
      toast.success("Datos actualizados");
    } catch {
      toast.error("Error al actualizar datos");
    }
  };

  const toggleAttendance = (userId: string) => {
    if (!data || !isDraft) return;
    setData({
      ...data,
      attendance: data.attendance.map((a) =>
        a.userId === userId ? { ...a, present: !a.present } : a,
      ),
    });
  };

  const addAgendaItem = () => {
    if (!data) return;
    setData({ ...data, agenda: [...data.agenda, ""] });
  };

  const updateAgendaItem = (index: number, value: string) => {
    if (!data) return;
    const agenda = [...data.agenda];
    agenda[index] = value;
    setData({ ...data, agenda });
  };

  const removeAgendaItem = (index: number) => {
    if (!data) return;
    setData({
      ...data,
      agenda: data.agenda.filter((_, i) => i !== index),
    });
  };

  const handleCreatePriority = async (positionId: string) => {
    const input = newCommitment[positionId];
    if (!input?.name?.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    try {
      const result = await createPriorityMut.mutateAsync({
        positionId,
        name: input.name.trim(),
        description: input.description?.trim() || undefined,
        status: (input.status as any) ?? "OPE",
        fromAt: input.fromAt || undefined,
        untilAt: input.untilAt || undefined,
        objectiveId: input.objectiveId || undefined,
      });

      setData((prev) => {
        if (!prev) return prev;
        const updatedPositions = prev.positions.map((pos) => {
          if (pos.positionId !== positionId) return pos;
          const alreadyExists = pos.priorities.some((p) => p.id === result.id);
          if (alreadyExists) return pos;
          return {
            ...pos,
            priorities: [
              ...pos.priorities,
              {
                id: result.id,
                name: result.name,
                description: result.description,
                status: result.status,
                monthlyClass: computeMonthlyClass(result) ?? result.monthlyClass,
                untilAt: result.untilAt?.slice(0, 10),
                finishedAt: result.finishedAt?.slice(0, 10),
                fromAt: result.fromAt?.slice(0, 10),
                createdAt: result.createdAt,
                objectiveName: result.objectiveName,
              },
            ],
          };
        });
        return { ...prev, positions: updatedPositions };
      });

      setNewCommitment((prev) => ({
        ...prev,
        [positionId]: { name: "", description: "", status: "OPE", fromAt: "", untilAt: "", objectiveId: "", finishedAt: "" },
      }));
      setCreateModalPositionId(null);
      toast.success("Prioridad creada");
    } catch {
      toast.error("Error al crear prioridad");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!meeting) {
    return <div className="p-8 text-center">Reunión no encontrada</div>;
  }

  // Mostrar loader mientras se auto-crea el acta
  if (!data) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 w-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{meeting.name}</h1>
            {isFinalized ? (
              <Badge className="bg-green-600 text-white">Finalizada</Badge>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-900 border border-yellow-300">
                Borrador
              </Badge>
            )}
            <Badge variant="outline">v{version}</Badge>
          </div>
          <p className="text-muted-foreground">
            {new Date(meeting.startDate).toLocaleDateString("es-ES", {
              dateStyle: "long",
            })}{" "}
            · {meeting.startDate?.slice(11, 16)} -{" "}
            {meeting.endDate?.slice(11, 16)} ·{" "}
            {meeting.location ?? "Sin ubicación"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StrategicPlanSelect
            businessUnitId={getBusinessUnitId() ?? undefined}
            value={strategicPlanId ?? undefined}
            onChange={(id) => {
              lastFetchedPlan.current = null;
              setStrategicPlanId(id);
            }}
            persist
            clearOnUnmount
          />
          {isDraft && (
            <>
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
              <Button onClick={handleFinalize} disabled={finalizeMut.isPending}>
                {finalizeMut.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Finalizar Acta
              </Button>
            </>
          )}
          {minutesId && (
            <>
              {isFinalized && (
                <Button
                  variant="outline"
                  onClick={handleCreateNewVersion}
                  disabled={createMinutesMut.isPending}
                >
                  {createMinutesMut.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Nueva versión
                </Button>
              )}
              <Button variant="outline" onClick={handleDownloadPdf}>
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={() => setShowVersionsModal(true)}
            title="Ver todas las versiones"
          >
            Versiones
          </Button>
          <Button variant="outline" onClick={onBack}>
            Volver
          </Button>
        </div>
      </div>

      {/* Block 1: Agenda + Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Agenda del día</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.agenda.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground w-6">
                  {i + 1}.
                </span>
                <Input
                  value={item}
                  onChange={(e) => updateAgendaItem(i, e.target.value)}
                  disabled={!isDraft}
                  placeholder="Punto de agenda..."
                />
                {isDraft && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAgendaItem(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {isDraft && (
              <Button variant="outline" size="sm" onClick={addAgendaItem}>
                <Plus className="h-4 w-4 mr-2" /> Agregar punto
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Asistencia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.attendance.map((a) => (
              <div key={`att-${a.userId}`} className="flex items-center gap-3">
                <Checkbox
                  id={`att-${a.userId}`}
                  checked={a.present}
                  onCheckedChange={() => toggleAttendance(a.userId)}
                  disabled={!isDraft}
                />
                <Label
                  htmlFor={`att-${a.userId}`}
                  className={a.present ? "" : "text-muted-foreground"}
                >
                  {a.userName}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Block 2 & 3: Performance + Priorities per position */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Desempeño y Prioridades</h2>
        {isDraft && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshPerformance}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refrescar datos
          </Button>
        )}
      </div>

      {data.positions.map((pos, i) => {
        const isExpanded = expandedPositions.has(pos.positionId);
        return (
          <Card key={pos.positionId + '-' + i} className="overflow-hidden">
            <button
              type="button"
              onClick={() => togglePosition(pos.positionId)}
              className="w-full text-left"
            >
              <CardHeader className="py-3 hover:bg-muted/30 transition-colors cursor-pointer">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    {pos.positionName}
                    <span className="text-muted-foreground text-sm font-normal">
                      ({pos.userName})
                    </span>
                  </span>
                  {!isExpanded && pos.performance && (
                    <span className="text-xs text-muted-foreground">
                      ICO: {pos.performance.ico.toFixed(0)}% · ICP:{" "}
                      {pos.performance.icp.toFixed(0)}% · Avance del Proyecto:{" "}
                      {pos.performance.avance.toFixed(0)}%
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
            </button>
            {isExpanded && (
              <CardContent className="space-y-4 border-t">
                {/* Performance */}
                {pos.performance ? (
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {pos.performance.ico.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">ICO</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {pos.performance.icp.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">ICP</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {pos.performance.performance.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Performance
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {pos.performance.avance.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Avance del Proyecto
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sin datos de desempeño. Presiona "Refrescar datos".
                  </p>
                )}

                <Separator />

                {/* Priorities table split by month */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Prioridades</h4>
                  {(() => {
                    const { currentMonth, currentYear, nextMonth, nextYear } = getMonthRange();

                    const currentMonthPriorities = pos.priorities.filter(
                      (p) => priorityInMonth(p, currentMonth, currentYear),
                    );
                    const nextMonthPriorities = pos.priorities.filter(
                      (p) => priorityInMonth(p, nextMonth, nextYear),
                    );
                    const otherPriorities = pos.priorities.filter(
                      (p) =>
                        !priorityInMonth(p, currentMonth, currentYear) &&
                        !priorityInMonth(p, nextMonth, nextYear),
                    );

                    const hasAny =
                      currentMonthPriorities.length > 0 ||
                      nextMonthPriorities.length > 0 ||
                      otherPriorities.length > 0;

                    if (!hasAny) {
                      return (
                        <p className="text-sm text-muted-foreground mb-3">
                          Sin prioridades registradas
                        </p>
                      );
                    }

                    const renderTable = (items: typeof pos.priorities) => {
                      const uniqueItems = Array.from(
                        new Map(items.map((item) => [item.id, item])).values(),
                      );
                      return (
                      <div className="w-full overflow-x-auto">
                        <table className="w-full table-auto text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-3 py-2 text-center font-medium text-xs w-8">
                                #
                              </th>
                              <th className="px-3 py-2 text-left font-medium text-xs">
                                Prioridad
                              </th>
                              <th className="px-3 py-2 text-left font-medium text-xs">
                                Objetivo
                              </th>
                              <th className="px-3 py-2 text-center font-medium text-xs w-24">
                                Estado
                              </th>
                              <th className="px-3 py-2 text-center font-medium text-xs w-44">
                                Inicio / Fin
                              </th>
                              <th className="px-3 py-2 text-center font-medium text-xs w-40">
                                Fecha Terminado
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {uniqueItems.map((pr, idx) => {
                              const monthlyLabel = resolveMonthlyLabel(
                                pr.monthlyClass,
                              );
                              const monthlyStyle = resolveMonthlyStyle(
                                pr.monthlyClass,
                              );

                              const objectiveName = pr.objectiveName ?? "-";
                              const deliverableText = pr.description ?? "-";

                              const renderClosure = () => {
                                const finished = pr.finishedAt;
                                const canceled = pr.canceledAt;
                                if (!finished && !canceled) return null;
                                let showFinished = Boolean(finished);
                                let showCanceled = Boolean(canceled);
                                if (finished && canceled) {
                                  if (pr.status === "CLO") {
                                    showFinished = true;
                                    showCanceled = false;
                                  } else if (pr.status === "CAN") {
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
                              };

                              return (
                                <tr
                                  key={pr.id}
                                  className="border-t hover:bg-muted/30"
                                >
                                  <td className="px-3 py-2 text-center align-top whitespace-nowrap">
                                    {idx + 1}
                                  </td>
                                  <td className="px-3 py-2 align-top">
                                    <CellWithTooltip
                                      lines={[{ label: "Entregable", text: deliverableText }]}
                                      side="top"
                                    >
                                      <div className="font-medium leading-6 break-words whitespace-pre-wrap">
                                        {pr.name}
                                      </div>
                                    </CellWithTooltip>
                                  </td>
                                  <td className="px-3 py-2 align-top">
                                    <div className="text-sm break-words whitespace-pre-wrap">
                                      {objectiveName}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-center align-top whitespace-nowrap">
                                    {monthlyLabel ? (
                                      <Badge
                                        className="whitespace-nowrap border-0"
                                        style={monthlyStyle ?? {}}
                                      >
                                        {monthlyLabel}
                                      </Badge>
                                    ) : (
                                      <Badge
                                        className={
                                          pr.status === "OPE"
                                            ? "bg-yellow-100 text-yellow-900 border border-yellow-300"
                                            : pr.status === "CLO"
                                              ? "bg-green-600 text-white"
                                              : "bg-gray-200 text-gray-700"
                                        }
                                      >
                                        {pr.status === "OPE"
                                          ? "En proceso"
                                          : pr.status === "CLO"
                                            ? "Terminado"
                                            : "Anulado"}
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center align-top whitespace-nowrap">
                                    <div className="space-x-2 whitespace-nowrap justify-center">
                                      <Badge variant="outline">{formatDateBadge(pr.fromAt)}</Badge>
                                      <Badge variant="outline">{formatDateBadge(pr.untilAt)}</Badge>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-center align-top whitespace-nowrap">
                                    {renderClosure()}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  };

                    return (
                      <div className="space-y-3 mb-3">
                        {currentMonthPriorities.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1 font-medium">
                              Prioridades del Mes actual
                            </p>
                            {renderTable(currentMonthPriorities)}
                          </div>
                        )}
                        {nextMonthPriorities.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1 font-medium">
                              Prioridades del Próximo Mes
                            </p>
                            {renderTable(nextMonthPriorities)}
                          </div>
                        )}
                        {otherPriorities.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1 font-medium">
                              Otras prioridades
                            </p>
                            {renderTable(otherPriorities)}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Create priority button */}
                  {canCreate && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCreateModalPositionId(pos.positionId)}
                      className="mt-3 w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva prioridad
                    </Button>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Block 5: Observations + Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Observaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={data.observations}
            onChange={(e) => setData({ ...data, observations: e.target.value })}
            disabled={!isDraft}
            placeholder="Escribe observaciones aquí..."
            rows={6}
            maxLength={3000}
          />
          <div className="text-xs text-muted-foreground text-right">
            {data.observations.length}/3000
          </div>

          {minutesId && isDraft && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDocsModal(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Adjuntar documentos
            </Button>
          )}

          {isFinalized && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDocsModal(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Ver documentos
            </Button>
          )}
        </CardContent>
      </Card>

      {showDocsModal && minutesId && (
        <UploadFilesModal
          open={showDocsModal}
          onClose={() => setShowDocsModal(false)}
          referenceId={minutesId}
          type="document"
          title={`Documentos del acta v${version}`}
        />
      )}

      {/* Modal versiones */}
      <Dialog open={showVersionsModal} onOpenChange={setShowVersionsModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>Versiones del acta</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin versiones registradas</p>
            ) : versions.map((v) => (
              <div
                key={v.id}
                className={`cursor-pointer rounded-xl border p-3 transition-colors hover:bg-muted/50 ${
                  v.id === minutesId ? "border-primary/50 bg-primary/5" : "bg-background"
                }`}
                onClick={() => {
                  setData(v.data);
                  setMinutesId(v.id);
                  setStatus(v.status);
                  setVersion(v.version);
                  setShowVersionsModal(false);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Versi&oacute;n {v.version}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.status === "FINALIZED" ? "Finalizada" : "Borrador"} &middot; {formatDateBadge(v.createdAt)}
                    </p>
                  </div>
                  <Badge variant={v.status === "FINALIZED" ? "default" : "secondary"}>
                    {v.status === "FINALIZED" ? "Finalizada" : "Borrador"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVersionsModal(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal nueva prioridad */}
      <Dialog
        open={!!createModalPositionId}
        onOpenChange={(open) => {
          if (!open) {
            setCreateModalPositionId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Nueva prioridad</DialogTitle>
          </DialogHeader>

          {createModalPositionId && (
            <div className="space-y-4 py-2">
              {/* Fila 1: Nombre + Entregable */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-4">
                  <Label className="text-xs text-muted-foreground block mb-1">
                    Nombre
                  </Label>
                  <TextareaWithCounter
                    value={newCommitment[createModalPositionId]?.name ?? ""}
                    onChange={(e) =>
                      setNewCommitment((prev) => ({
                        ...prev,
                        [createModalPositionId]: {
                          ...prev[createModalPositionId],
                          name: e.target.value,
                          status: prev[createModalPositionId]?.status ?? "OPE",
                          fromAt: prev[createModalPositionId]?.fromAt ?? "",
                          untilAt: prev[createModalPositionId]?.untilAt ?? "",
                          objectiveId: prev[createModalPositionId]?.objectiveId ?? "",
                          description: prev[createModalPositionId]?.description ?? "",
                          finishedAt: prev[createModalPositionId]?.finishedAt ?? "",
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
                    value={newCommitment[createModalPositionId]?.description ?? ""}
                    onChange={(e) =>
                      setNewCommitment((prev) => ({
                        ...prev,
                        [createModalPositionId]: {
                          ...prev[createModalPositionId],
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
              </div>

              {/* Objetivo full width */}
              <div>
                <Label className="text-xs text-muted-foreground block mb-1">
                  Objetivo
                </Label>
                <ObjectiveSelect
                  planId={strategicPlanId ?? undefined}
                  positionId={createModalPositionId}
                  year={new Date().getFullYear()}
                  value={newCommitment[createModalPositionId]?.objectiveId ?? undefined}
                  onChange={(val) =>
                    setNewCommitment((prev) => ({
                      ...prev,
                      [createModalPositionId]: {
                        ...prev[createModalPositionId],
                        objectiveId: val ?? "",
                      },
                    }))
                  }
                  otherPositions={otherPositions}
                  stacked
                />
              </div>

              {/* Estado + Desde + Hasta + Terminado */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground block mb-1">
                    Estado
                  </Label>
                  <Select
                    value={newCommitment[createModalPositionId]?.status ?? "OPE"}
                    onValueChange={(v) =>
                      setNewCommitment((prev) => ({
                        ...prev,
                        [createModalPositionId]: {
                          ...prev[createModalPositionId],
                          status: v,
                          finishedAt:
                            v === "CLO" && !prev[createModalPositionId]?.finishedAt
                              ? dayjs().format("YYYY-MM-DD")
                              : prev[createModalPositionId]?.finishedAt ?? "",
                        },
                      }))
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
                <div>
                  <Label className="text-xs text-muted-foreground block mb-1">
                    Desde
                  </Label>
                  <DateEditor
                    value={newCommitment[createModalPositionId]?.fromAt || undefined}
                    open={createFromOpen}
                    onOpenChange={setCreateFromOpen}
                    onChange={(val) => {
                      setNewCommitment((prev) => ({
                        ...prev,
                        [createModalPositionId]: {
                          ...prev[createModalPositionId],
                          fromAt: val ?? "",
                        },
                      }));
                      if (val) setCreateUntilOpen(true);
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground block mb-1">
                    Hasta
                  </Label>
                  <DateEditor
                    value={newCommitment[createModalPositionId]?.untilAt || undefined}
                    minDate={parseYmdOrIsoToLocalDate(newCommitment[createModalPositionId]?.fromAt)}
                    open={createUntilOpen}
                    onOpenChange={setCreateUntilOpen}
                    onChange={(val) =>
                      setNewCommitment((prev) => ({
                        ...prev,
                        [createModalPositionId]: {
                          ...prev[createModalPositionId],
                          untilAt: val ?? "",
                        },
                      }))
                    }
                  />
                </div>
                {newCommitment[createModalPositionId]?.status === "CLO" && (
                  <div>
                    <Label className="text-xs text-muted-foreground block mb-1">
                      Terminado
                    </Label>
                    <DateEditor
                      value={newCommitment[createModalPositionId]?.finishedAt || undefined}
                      onChange={(val) =>
                        setNewCommitment((prev) => ({
                          ...prev,
                          [createModalPositionId]: {
                            ...prev[createModalPositionId],
                            finishedAt: val ?? "",
                          },
                        }))
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateModalPositionId(null)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (createModalPositionId) {
                  handleCreatePriority(createModalPositionId);
                }
              }}
              disabled={
                createPriorityMut.isPending ||
                !newCommitment[createModalPositionId ?? ""]?.name?.trim()
              }
            >
              {createPriorityMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
