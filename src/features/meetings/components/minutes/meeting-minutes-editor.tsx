"use client";

import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { ConfirmModal } from "@/shared/components/confirm-modal";
import { UploadFilesModal } from "@/shared/components/upload-files-modal";
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
import { useAuth } from "@/features/auth/context/AuthContext";
import { useAnyPermission } from "@/shared/auth/access-control";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";
import type {
  MeetingMinutesData,
  MinutesResponse,
  MinutesPosition,
  MinutesAttendance,
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

interface Props {
  meetingId: string;
  onBack: () => void;
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
  const [newCommitment, setNewCommitment] = useState<
    Record<
      string,
      { name: string; description: string; status: string; untilAt: string }
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

  // Sync today's priorities from pos.priorities is done at render time

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

  const fetchAndSaveLiveData = async (currentData: MeetingMinutesData) => {
    try {
      const { getPositionsOverview } =
        await import("@/features/positions/services/positionsService");
      const { prioritiesService } =
        await import("@/features/priorities/services/prioritiesService");
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

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
                      month,
                      year,
                    }).catch(() => null)
                  : Promise.resolve(null);

              const prioritiesPromise = prioritiesService
                .getPriorities({
                  positionId: pos.positionId,
                  month,
                  year,
                  page: 1,
                  limit: 1000,
                })
                .catch(() => null);

              const [overview, prioritiesRes] = await Promise.all([
                overviewPromise,
                prioritiesPromise,
              ]);

              const item = overview?.listPositions?.[0];

              // Separate today's priorities from existing ones
              let existingPriorities: any[] = [];
              let todayPriorities: any[] = [];
              if (prioritiesRes?.items) {
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                for (const pr of prioritiesRes.items) {
                  const createdAt = pr.createdAt
                    ? new Date(pr.createdAt)
                    : null;
                  if (createdAt && createdAt >= startOfDay) {
                    todayPriorities.push(pr);
                  } else {
                    existingPriorities.push(pr);
                  }
                }
              }

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
                priorities: [
                  ...existingPriorities.map((pr: any) => ({
                    id: pr.id,
                    name: pr.name,
                    status: pr.status,
                    monthlyClass: pr.monthlyClass,
                    untilAt: pr.untilAt?.slice(0, 10),
                    finishedAt: pr.finishedAt?.slice(0, 10),
                    canceledAt: pr.canceledAt?.slice(0, 10),
                    fromAt: pr.fromAt?.slice(0, 10),
                    createdAt: pr.createdAt,
                  })),
                  ...todayPriorities.map((pr: any) => ({
                    id: pr.id,
                    name: pr.name,
                    status: pr.status,
                    monthlyClass: pr.monthlyClass,
                    untilAt: pr.untilAt?.slice(0, 10),
                    finishedAt: pr.finishedAt?.slice(0, 10),
                    canceledAt: pr.canceledAt?.slice(0, 10),
                    fromAt: pr.fromAt?.slice(0, 10),
                    createdAt: pr.createdAt,
                  })),
                ],
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
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

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
                  month,
                  year,
                }).catch(() => null)
              : Promise.resolve(null);

          const prioritiesPromise = prioritiesService
            .getPriorities({
              positionId: pos.positionId,
              month,
              year,
              page: 1,
              limit: 1000,
            })
            .catch(() => null);

          const [overview, prioritiesRes] = await Promise.all([
            overviewPromise,
            prioritiesPromise,
          ]);

          const item = overview?.listPositions?.[0];
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
            priorities:
              prioritiesRes?.items?.map((pr: any) => ({
                id: pr.id,
                name: pr.name,
                status: pr.status,
                monthlyClass: pr.monthlyClass,
                untilAt: pr.untilAt?.slice(0, 10),
                finishedAt: pr.finishedAt?.slice(0, 10),
                canceledAt: pr.canceledAt?.slice(0, 10),
                fromAt: pr.fromAt?.slice(0, 10),
              })) ?? [],
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
      await createPriorityMut.mutateAsync({
        positionId,
        name: input.name.trim(),
        description: input.description?.trim() || undefined,
        status: (input.status as any) ?? "OPE",
        untilAt: input.untilAt || undefined,
      });
      setNewCommitment((prev) => ({
        ...prev,
        [positionId]: { name: "", description: "", status: "OPE", untilAt: "" },
      }));
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

  // No minutes yet - show create button
  if (!data) {
    return (
      <div className="p-8 space-y-6 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{meeting.name}</h1>
            <p className="text-muted-foreground">
              {new Date(meeting.startDate).toLocaleDateString("es-ES", {
                dateStyle: "long",
              })}{" "}
              · {meeting.location ?? "Sin ubicación"}
            </p>
          </div>
          <Button onClick={onBack} variant="outline">
            Volver
          </Button>
        </div>
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
            <p className="text-lg font-medium">No hay acta para esta reunión</p>
            <p className="text-muted-foreground">
              Genera un acta para capturar el estado estratégico actual
            </p>
            <Button
              onClick={handleCreate}
              disabled={createMinutesMut.isPending}
              size="lg"
            >
              {createMinutesMut.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Generar Acta
            </Button>
          </CardContent>
        </Card>
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
            <Button variant="outline" onClick={handleDownloadPdf}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          )}
          <Button variant="outline" onClick={onBack}>
            Volver
          </Button>
        </div>
      </div>

      {/* Block 1: Agenda */}
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
          <Card key={pos.positionId || i} className="overflow-hidden">
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
                      {pos.performance.icp.toFixed(0)}% · Avance:{" "}
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
                        Avance
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sin datos de desempeño. Presiona "Refrescar datos".
                  </p>
                )}

                <Separator />

                {/* Priorities table split by createdAt */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Prioridades</h4>
                  {(() => {
                    const startOfDay = new Date();
                    startOfDay.setHours(0, 0, 0, 0);
                    const existing = pos.priorities.filter(
                      (p) => !p.createdAt || new Date(p.createdAt) < startOfDay,
                    );
                    const todayItems = pos.priorities.filter(
                      (p) => p.createdAt && new Date(p.createdAt) >= startOfDay,
                    );
                    const hasAny = existing.length > 0 || todayItems.length > 0;

                    if (!hasAny) {
                      return (
                        <p className="text-sm text-muted-foreground mb-3">
                          Sin prioridades registradas
                        </p>
                      );
                    }

                    const renderTable = (items: typeof pos.priorities) => (
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-xs">
                                Prioridad
                              </th>
                              <th className="px-3 py-2 text-center font-medium text-xs w-28">
                                Estado
                              </th>
                              <th className="px-3 py-2 text-center font-medium text-xs w-44">
                                Inicio / Fin
                              </th>
                              <th className="px-3 py-2 text-center font-medium text-xs w-32">
                                Terminado
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((pr) => {
                              const monthlyLabel = resolveMonthlyLabel(
                                pr.monthlyClass,
                              );
                              const monthlyStyle = resolveMonthlyStyle(
                                pr.monthlyClass,
                              );
                              const mainBadge = monthlyLabel ? (
                                <Badge
                                  className="whitespace-nowrap border-0"
                                  style={monthlyStyle ?? {}}
                                >
                                  {monthlyLabel}
                                </Badge>
                              ) : (
                                <Badge
                                  variant={
                                    pr.status === "CLO"
                                      ? "default"
                                      : pr.status === "CAN"
                                        ? "secondary"
                                        : "outline"
                                  }
                                  className="text-xs"
                                >
                                  {pr.status === "OPE"
                                    ? "En proceso"
                                    : pr.status === "CLO"
                                      ? "Terminado"
                                      : "Anulado"}
                                </Badge>
                              );
                              return (
                                <tr
                                  key={pr.id}
                                  className="border-t hover:bg-muted/30"
                                >
                                  <td className="px-3 py-2 whitespace-pre-wrap break-words">
                                    {pr.name}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {mainBadge}
                                  </td>
                                  <td className="px-3 py-2 text-center whitespace-nowrap">
                                    <span className="text-xs">
                                      <Badge variant="outline" className="mr-1">
                                        {formatDateBadge(pr.fromAt)}
                                      </Badge>
                                      <Badge variant="outline">
                                        {formatDateBadge(pr.untilAt)}
                                      </Badge>
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-center whitespace-nowrap">
                                    {pr.status === "CLO" && pr.finishedAt && (
                                      <Badge variant="outline">
                                        {formatDateBadge(pr.finishedAt)}
                                      </Badge>
                                    )}
                                    {pr.status === "CAN" && pr.canceledAt && (
                                      <Badge variant="outline">
                                        {formatDateBadge(pr.canceledAt)}
                                      </Badge>
                                    )}
                                    {pr.status === "OPE" && (
                                      <span className="text-xs text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );

                    return (
                      <div className="space-y-3 mb-3">
                        {existing.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1 font-medium">
                              Existentes
                            </p>
                            {renderTable(existing)}
                          </div>
                        )}
                        {todayItems.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1 font-medium">
                              Compromisos
                            </p>
                            {renderTable(todayItems)}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Create form */}
                  {canCreate && (
                    <div className="flex items-start gap-2 pt-1">
                      <div className="flex-1 space-y-1">
                        <Input
                          placeholder="Nombre de la prioridad..."
                          value={newCommitment[pos.positionId]?.name ?? ""}
                          onChange={(e) =>
                            setNewCommitment((prev) => ({
                              ...prev,
                              [pos.positionId]: {
                                ...prev[pos.positionId],
                                name: e.target.value,
                                status: prev[pos.positionId]?.status ?? "OPE",
                                untilAt: prev[pos.positionId]?.untilAt ?? "",
                              },
                            }))
                          }
                        />
                        <div className="flex gap-2">
                          <Select
                            value={
                              newCommitment[pos.positionId]?.status ?? "OPE"
                            }
                            onValueChange={(v) =>
                              setNewCommitment((prev) => ({
                                ...prev,
                                [pos.positionId]: {
                                  ...prev[pos.positionId],
                                  status: v,
                                  name: prev[pos.positionId]?.name ?? "",
                                  untilAt: prev[pos.positionId]?.untilAt ?? "",
                                },
                              }))
                            }
                          >
                            <SelectTrigger className="h-9 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OPE">En proceso</SelectItem>
                              <SelectItem value="CLO">Terminado</SelectItem>
                              <SelectItem value="CAN">Anulado</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="date"
                            className="h-9 w-40"
                            value={newCommitment[pos.positionId]?.untilAt ?? ""}
                            onChange={(e) =>
                              setNewCommitment((prev) => ({
                                ...prev,
                                [pos.positionId]: {
                                  ...prev[pos.positionId],
                                  untilAt: e.target.value,
                                  name: prev[pos.positionId]?.name ?? "",
                                  status: prev[pos.positionId]?.status ?? "OPE",
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleCreatePriority(pos.positionId)}
                        disabled={
                          createPriorityMut.isPending ||
                          !newCommitment[pos.positionId]?.name?.trim()
                        }
                        className="shrink-0"
                      >
                        {createPriorityMut.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Block 5: Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Asistencia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.attendance.map((a) => (
            <div key={a.userId} className="flex items-center gap-3">
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

      {/* Block 6: Observations + Documents */}
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

      <ConfirmModal
        open={showDocsModal}
        onCancel={() => setShowDocsModal(false)}
        onConfirm={() => setShowDocsModal(false)}
        title="Documentos"
        message=""
      />

      {showDocsModal && minutesId && (
        <UploadFilesModal
          open={showDocsModal}
          onClose={() => setShowDocsModal(false)}
          referenceId={minutesId}
          type="document"
          title={`Documentos del acta v${version}`}
        />
      )}
    </div>
  );
}
