"use client";

import { useEffect, useMemo, useState } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, FileText, Loader2,
  MapPin, Pencil, Search, Trash, Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ConfirmModal } from "@/shared/components/confirm-modal";
import { getCompanyId } from "@/shared/auth/storage";
import { useAuth } from "@/features/auth/context/AuthContext";
import { usePermission } from "@/shared/auth/access-control";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";

import {
  useMyMeetingsQuery,
  useDeleteMeetingMutation,
} from "../hooks/use-meetings";

interface MeetingListViewProps {
  onEdit: (meetingId: string) => void;
  onGenerateMinutes: (meetingId: string, occurrenceId?: string) => void;
}

function MeetingDateBox({ date }: { date: Date }) {
  return (
    <div className="flex h-[88px] w-[76px] shrink-0 flex-col overflow-hidden rounded-2xl border bg-muted/30 text-center shadow-sm">
      <div className="bg-primary/10 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-primary">
        {format(date, "MMM", { locale: es })}
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-2">
        <p className="text-2xl font-bold leading-none">{format(date, "dd", { locale: es })}</p>
        <p className="mt-1 text-[11px] font-medium capitalize text-muted-foreground">{format(date, "EEE", { locale: es })}</p>
      </div>
    </div>
  );
}

export function MeetingListView({ onEdit, onGenerateMinutes }: MeetingListViewProps) {
  const { me } = useAuth();
  const canManageAny = usePermission(PERMISSIONS.MEETINGS.MANAGE);
  const canDelete = usePermission(PERMISSIONS.MEETINGS.DELETE);
  const companyId = getCompanyId();

  const { data: meetings, isLoading } = useMyMeetingsQuery(companyId ?? "");
  const deleteMutation = useDeleteMeetingMutation();

  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isClientReady, setIsClientReady] = useState(false);

  const meetingToDeleteInfo = useMemo(() => {
    if (!meetingToDelete) return null;
    return meetings?.find((m) => m.id === meetingToDelete) ?? null;
  }, [meetingToDelete, meetings]);

  const deleteHasMinutes = (meetingToDeleteInfo?._count?.minutes ?? 0) > 0;
  const deleteMinutesCount = meetingToDeleteInfo?._count?.minutes ?? 0;

  // Inicializar filtro al mes actual solo en cliente (evita hydration error)
  useEffect(() => {
    setFilterMonth(format(new Date(), "yyyy-MM"));
    setIsClientReady(true);
  }, []);

  const monthOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    for (let i = -12; i <= 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      opts.push({ value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy", { locale: es }) });
    }
    return opts;
  }, []);

  const sortedMeetings = useMemo(() => {
    return [...(meetings ?? [])].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
  }, [meetings]);

  const filteredMeetings = useMemo(() => {
    return sortedMeetings.filter((m) => {
      if (filterMonth !== "all") {
        const mStr = format(new Date(m.startDate), "yyyy-MM");
        if (mStr !== filterMonth) return false;
      }
      if (filterRole !== "all") {
        const p = m.participants?.find((x) => x.userId === me?.id);
        if (!p) return false;
        if (filterRole === "convener" && p.role !== "CONVENER") return false;
        if (filterRole === "participant" && p.role !== "PARTICIPANT") return false;
        if (filterRole === "required" && !p.isRequired) return false;
      }
      if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [sortedMeetings, filterMonth, filterRole, searchQuery, me?.id]);

  const handleDelete = () => {
    if (!meetingToDelete) return;
    deleteMutation.mutate(meetingToDelete, {
      onSuccess: () => {
        toast.success("Reunión eliminada");
        setMeetingToDelete(null);
      },
      onError: () => toast.error("Error al eliminar"),
    });
  };

  const prevMonth = () => {
    const [y, m] = filterMonth.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setFilterMonth(format(d, "yyyy-MM"));
  };
  const nextMonth = () => {
    const [y, m] = filterMonth.split("-").map(Number);
    const d = new Date(y, m, 1);
    setFilterMonth(format(d, "yyyy-MM"));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-2xl border bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Cargando reuniones...</p>
        </div>
      </div>
    );
  }

  if (!isClientReady) {
    return <div className="min-h-[260px]" />;
  }

  return (
    <>
      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-xl" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="h-9 w-[140px] rounded-xl text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los meses</SelectItem>
              {monthOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-xl" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="h-9 w-[150px] rounded-xl text-xs">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="convener">Convocante</SelectItem>
            <SelectItem value="participant">Participante</SelectItem>
            <SelectItem value="required">Obligatorio</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar reunión..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 rounded-xl pl-9 text-xs"
          />
        </div>
      </div>

      {filteredMeetings.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 py-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border bg-background text-muted-foreground shadow-sm">
            <CalendarDays className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold">No tienes reuniones asignadas</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {searchQuery || filterMonth !== "all" || filterRole !== "all"
              ? "No hay reuniones que coincidan con los filtros seleccionados."
              : "Cuando tengas reuniones programadas aparecerán aquí."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredMeetings.map((meeting) => {
            const startDate = new Date(meeting.startDate);
            const endDate = new Date(meeting.endDate);
            const canManageMeeting =
              meeting.participants?.some(
                (p) => p.role === "CONVENER" && p.userId === me?.id,
              ) || canManageAny;
            const participantCount = meeting.participants?.length ?? 0;

            return (
              <article
                key={meeting.id}
                className="group flex min-h-[200px] flex-col rounded-2xl border bg-background p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <MeetingDateBox date={startDate} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                          <Badge variant="secondary" className="rounded-full px-2">Reunión</Badge>
                          {(meeting.parentId || (meeting._count?.children ?? 0) > 0) && <Badge variant="outline" className="rounded-full px-2">Serie</Badge>}
                        </div>
                        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{meeting.name}</h3>
                      </div>
                      {canDelete && canManageMeeting && (
                        <Button type="button" variant="ghost" size="icon" title="Eliminar reunión"
                          className="h-8 w-8 shrink-0 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => setMeetingToDelete(meeting.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {meeting.purpose && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{meeting.purpose}</p>
                    )}
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{format(startDate, "EEEE, HH:mm", { locale: es })} - {format(endDate, "HH:mm", { locale: es })}</span>
                  </div>
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span>{participantCount} participante{participantCount === 1 ? "" : "s"}</span>
                  </div>
                  {meeting._count && (
                    <div className="flex min-w-0 items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span>{meeting._count.minutes} acta{meeting._count.minutes === 1 ? "" : "s"}</span>
                      {meeting.minutes && meeting.minutes.length > 0 && (
                        <Badge variant="outline" className="rounded-full px-2 text-[10px]">
                          v{meeting.minutes[0].version} · {meeting.minutes[0].status === "FINALIZED" ? "Finalizada" : "Borrador"}
                        </Badge>
                      )}
                    </div>
                  )}
                  {meeting.location && (
                    <div className="flex min-w-0 items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{meeting.location}</span>
                    </div>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-end gap-2 pt-4">
                  {canManageMeeting ? (
                    <>
                      <Button type="button" variant="outline" size="sm" className="h-8 rounded-xl px-2.5 text-xs" onClick={() => onEdit(meeting.id)}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="h-8 rounded-xl px-2.5 text-xs" onClick={() => onGenerateMinutes(meeting.id)} title="Generar acta">
                        <FileText className="mr-1.5 h-3.5 w-3.5" /> Acta
                      </Button>
                    </>
                  ) : (
                    <Badge variant="outline" className="rounded-full">Solo lectura</Badge>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={!!meetingToDelete}
        onCancel={() => setMeetingToDelete(null)}
        onConfirm={handleDelete}
        title={deleteHasMinutes ? "¿Eliminar reunión?" : "Eliminar reunión"}
        message={deleteHasMinutes
          ? `Esta reunión tiene ${deleteMinutesCount} acta${deleteMinutesCount === 1 ? "" : "s"} registrada${deleteMinutesCount === 1 ? "" : "s"}. Si la eliminas no podrás acceder a ellas.`
          : "¿Estás seguro de eliminar esta reunión? Esta acción no se puede deshacer."}
        confirmText="Eliminar"
        isDestructive
      />
    </>
  );
}
