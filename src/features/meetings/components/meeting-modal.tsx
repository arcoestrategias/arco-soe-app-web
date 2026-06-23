"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Plus,
  Trash,
  X,
  Calendar,
  Clock,
  MapPin,
  Wrench,
  Users,
  ListChecks,
  AlertTriangle,
  Sparkles,
  UserRound,
  ClipboardList,
  CalendarDays,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { toast } from "sonner";
import { format, addDays, addWeeks, addMonths } from "date-fns";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/shared/components/confirm-modal";
import { SelectInput } from "@/shared/components/select-input";

import {
  useMeetingByIdQuery,
  useCreateMeetingMutation,
  useUpdateMeetingMutation,
  useDeleteMeetingMutation,
} from "../hooks/use-meetings";
import { useMeetingCandidates } from "../hooks/use-meeting-candidates";
import { getCompanyId, getBusinessUnitId } from "@/shared/auth/storage";
import { useAuth } from "@/features/auth/context/AuthContext";
import { usePermission } from "@/shared/auth/access-control";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";
import { routes } from "@/shared/api/routes";
import { http } from "@/shared/api/http";
import { unwrapAny } from "@/shared/api/response";
import { QKEY } from "@/shared/api/query-keys";

import type {
  MeetingRole,
  MeetingFrequency,
  SiblingMeeting,
} from "../types/meetings.types";

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string | null;
  initialDate?: Date | null;
}

type FormValues = {
  name: string;
  purpose: string;
  location: string;
  tools: string;
  date: string;
  startTime: string;
  endTime: string;
  participants: { userId: string; role: MeetingRole; isRequired: boolean }[];
  frequency: MeetingFrequency;
  daysOfWeek: number[];
  repeatUntil: string;
  agenda: string[];
  applyToGroup: boolean;
};

function addFrequency(
  baseDate: Date,
  frequency: MeetingFrequency,
  count: number,
): Date {
  switch (frequency) {
    case "DAILY":
      return addDays(baseDate, count);
    case "WEEKLY":
      return addWeeks(baseDate, count);
    case "BIWEEKLY":
      return addWeeks(baseDate, count * 2);
    case "MONTHLY":
      return addMonths(baseDate, count);
    default:
      return baseDate;
  }
}

function safeParseDate(d: Date | string | undefined | null): Date {
  if (!d) return new Date();
  if (typeof d === "string") return new Date(d);
  return d;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function SectionCard({
  icon,
  title,
  description,
  children,
  className = "",
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border bg-card/80 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3 border-b bg-muted/30 px-4 py-3">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl border bg-background text-muted-foreground shadow-sm">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-tight">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function MeetingModal({
  isOpen,
  onClose,
  meetingId,
  initialDate,
}: MeetingModalProps) {
  const { me } = useAuth();
  const canManageAny = usePermission(PERMISSIONS.MEETINGS.MANAGE);
  const isEditing = !!meetingId;
  const { data: meetingData, isLoading: isLoadingMeeting } =
    useMeetingByIdQuery(meetingId);
  const isConvenerUser =
    meetingData?.participants?.some(
      (p) => p.role === "CONVENER" && p.userId === me?.id,
    ) ?? false;
  const readOnly = isEditing && meetingData && !isConvenerUser && !canManageAny;
  const createMutation = useCreateMeetingMutation();
  const updateMutation = useUpdateMeetingMutation();
  const deleteMutation = useDeleteMeetingMutation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showGroupMinutesConfirm, setShowGroupMinutesConfirm] = useState(false);
  const [showGroupConfirm, setShowGroupConfirm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const { groups } = useMeetingCandidates();
  const allUsers = useMemo(() => groups.flatMap((g) => g.users), [groups]);
  const selectableUsers = useMemo(() => {
    const users = [...allUsers];
    const existingIds = new Set(users.map((u) => u.id));
    if (meetingData?.participants) {
      meetingData.participants.forEach((p) => {
        if (p.user && p.user.id && !existingIds.has(p.user.id)) {
          users.push(p.user as any);
          existingIds.add(p.user.id);
        }
      });
    }
    return users;
  }, [allUsers, meetingData]);

  const belongsToGroup =
    !!meetingData?.parentId || (meetingData as any)?._count?.children > 0;

  const [siblings, setSiblings] = useState<SiblingMeeting[]>([]);

  useEffect(() => {
    if (!isEditing || !isOpen || !meetingData) return;
    const pid = meetingData.parentId ?? meetingId!;
    http
      .get(routes.meetings.siblings(pid))
      .then((res: any) => {
        const data = unwrapAny<any[]>(res.data) ?? [];
        setSiblings(data);
        const maxSibDate =
          data.length > 0
            ? format(
                new Date(
                  Math.max(
                    ...data.map((s: any) => new Date(s.startDate).getTime()),
                  ),
                ),
                "yyyy-MM-dd",
              )
            : null;
        if (maxSibDate && !getValues("repeatUntil")) {
          setValue("repeatUntil", maxSibDate);
        }
      })
      .catch(() => {
        /* ignore */
      });
  }, [isEditing, isOpen, meetingData, meetingId]);

  const hasSiblingsWithMinutes = siblings.some(
    (s) => (s._count?.minutes ?? 0) > 0,
  );
  const hasFutureSiblingsWithMinutes = siblings.some(
    (s) => new Date(s.startDate) >= new Date() && (s._count?.minutes ?? 0) > 0,
  );
  const siblingsWithMinutes = siblings.filter(
    (s) => (s._count?.minutes ?? 0) > 0,
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      purpose: "",
      location: "",
      tools: "",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "10:00",
      participants: [],
      frequency: "ONCE",
      daysOfWeek: [],
      repeatUntil: "",
      agenda: [],
      applyToGroup: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "participants",
  });

  const frequency = watch("frequency");
  const applyToGroup = watch("applyToGroup");
  const repeatUntil = watch("repeatUntil");
  const watchDate = watch("date");
  const watchName = watch("name");
  const watchParticipants = watch("participants");
  const watchAgenda = watch("agenda");

  const preview = useMemo(() => {
    if (!applyToGroup || !meetingData || frequency === "ONCE") return null;
    const meetingDateObj = parseLocalDate(watchDate);
    const freq = frequency as MeetingFrequency;
    const siblingMax =
      siblings.length > 0
        ? new Date(
            Math.max(...siblings.map((s) => new Date(s.startDate).getTime())),
          )
        : meetingDateObj;
    const repeatUntilDate = repeatUntil ? parseLocalDate(repeatUntil) : null;
    const maxSiblingDate =
      repeatUntilDate && repeatUntilDate > siblingMax
        ? repeatUntilDate
        : siblingMax;

    const expectedDates: Date[] = [];
    let current = new Date(meetingDateObj);
    while (current <= maxSiblingDate) {
      expectedDates.push(new Date(current));
      current = addFrequency(current, freq, 1);
    }

    const futureSiblings = siblings.filter(
      (s) => s.id !== meetingId && new Date(s.startDate) > meetingDateObj,
    );
    const keptSiblings = futureSiblings.filter((s) =>
      expectedDates.some(
        (ed) => ed.toDateString() === new Date(s.startDate).toDateString(),
      ),
    );
    const cancelledSiblings = futureSiblings.filter(
      (s) =>
        !expectedDates.some(
          (ed) => ed.toDateString() === new Date(s.startDate).toDateString(),
        ),
    );
    const newDates = expectedDates.filter(
      (ed) =>
        ed.toDateString() !== meetingDateObj.toDateString() &&
        !siblings.some(
          (s) =>
            s.id !== meetingId &&
            new Date(s.startDate).toDateString() === ed.toDateString(),
        ),
    );

    return {
      keptSiblings,
      cancelledSiblings,
      newDates,
      hasAnyChange:
        keptSiblings.length > 0 ||
        cancelledSiblings.length > 0 ||
        newDates.length > 0,
    };
  }, [
    applyToGroup,
    meetingData,
    frequency,
    watchDate,
    siblings,
    meetingId,
    repeatUntil,
  ]);

  const generatedCount = useMemo(() => {
    if (frequency === "ONCE" || !repeatUntil) return 0;
    const start = new Date(watchDate);
    const end = new Date(repeatUntil);
    if (end <= start) return 0;
    const diffDays = Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    switch (frequency) {
      case "DAILY":
        return diffDays + 1;
      case "WEEKLY":
        return Math.floor(diffDays / 7) + 1;
      case "BIWEEKLY":
        return Math.floor(diffDays / 14) + 1;
      case "MONTHLY":
        return Math.floor(diffDays / 30) + 1;
      default:
        return 0;
    }
  }, [frequency, repeatUntil, watchDate]);

  // Auto-asignar día de la semana al elegir WEEKLY
  useEffect(() => {
    if (
      (frequency === "WEEKLY" || frequency === "BIWEEKLY") &&
      watchDate &&
      !isEditing
    ) {
      setValue("daysOfWeek", [new Date(watchDate).getDay()]);
    }
  }, [frequency, watchDate, isEditing, setValue]);

  useEffect(() => {
    if (isOpen && meetingData) {
      const siblingMaxDate =
        siblings.length > 0
          ? new Date(
              Math.max(...siblings.map((s) => new Date(s.startDate).getTime())),
            )
          : null;
      reset({
        name: meetingData.name,
        purpose: meetingData.purpose || "",
        location: meetingData.location || "",
        tools: meetingData.tools || "",
        date: format(safeParseDate(meetingData.startDate), "yyyy-MM-dd"),
        startTime: format(safeParseDate(meetingData.startDate), "HH:mm"),
        endTime: format(safeParseDate(meetingData.endDate), "HH:mm"),
        participants: (meetingData.participants || []).map((p) => ({
          userId: p.userId,
          role: p.role,
          isRequired: p.isRequired,
        })),
        frequency: meetingData.frequency ?? "ONCE",
        daysOfWeek: [],
        repeatUntil: siblingMaxDate ? format(siblingMaxDate, "yyyy-MM-dd") : "",
        agenda: meetingData.agenda ?? [],
        applyToGroup: isEditing && belongsToGroup,
      });
    } else if (isOpen && !isEditing) {
      reset({
        name: "",
        purpose: "",
        location: "",
        tools: "",
        date: initialDate
          ? format(initialDate, "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd"),
        startTime: "09:00",
        endTime: "10:00",
        participants: me?.id
          ? [
              {
                userId: me.id,
                role: "CONVENER" as MeetingRole,
                isRequired: true,
              },
            ]
          : [],
        frequency: "ONCE",
        daysOfWeek: [],
        repeatUntil: "",
        agenda: [],
        applyToGroup: false,
      });
    }
  }, [isOpen, meetingData, isEditing, reset, initialDate]);

  const buildPayloadBase = (values: FormValues) => {
    const startIso = `${values.date}T${values.startTime}:00`;
    const endIso = `${values.date}T${values.endTime}:00`;
    return {
      name: values.name,
      purpose: values.purpose,
      location: values.location,
      tools: values.tools,
      startDate: new Date(startIso).toISOString(),
      endDate: new Date(endIso).toISOString(),
      participants: values.participants,
      frequency: values.frequency,
      agenda: values.agenda?.length
        ? values.agenda.filter((a) => a.trim() !== "")
        : undefined,
    };
  };

  const validateBeforeSubmit = (values: FormValues) => {
    if (!values.name.trim()) {
      toast.error("Ingresa el nombre de la reunión");
      return false;
    }
    if (!values.date) {
      toast.error("Selecciona la fecha de la reunión");
      return false;
    }
    if (!values.startTime || !values.endTime) {
      toast.error("Selecciona la hora de inicio y fin");
      return false;
    }
    if (
      new Date(`${values.date}T${values.endTime}:00`) <=
      new Date(`${values.date}T${values.startTime}:00`)
    ) {
      toast.error("La hora de fin debe ser mayor a la hora de inicio");
      return false;
    }
    const dupes = values.participants
      .map((p) => p.userId)
      .filter(Boolean)
      .filter((uid, i, arr) => arr.indexOf(uid) !== i);
    if (dupes.length > 0) {
      toast.error("Hay participantes duplicados");
      return false;
    }
    if (values.participants.length === 0) {
      toast.error("Agrega al menos un participante");
      return false;
    }
    if (values.participants.some((p) => !p.userId)) {
      toast.error("Selecciona el usuario en todos los participantes");
      return false;
    }
    const cc = values.participants.filter((p) => p.role === "CONVENER").length;
    if (cc === 0) {
      toast.error("Debe haber al menos un convocante");
      return false;
    }
    if (cc > 1) {
      toast.error("Solo puede haber un convocante");
      return false;
    }
    if (values.frequency !== "ONCE" && !values.repeatUntil && !isEditing) {
      toast.error("Selecciona hasta cuándo se repetirá la reunión");
      return false;
    }
    return true;
  };

  const onSubmit = async (values: FormValues) => {
    if (readOnly) {
      onClose();
      return;
    }
    if (!validateBeforeSubmit(values)) return;
    const companyId = getCompanyId();
    const businessUnitId = getBusinessUnitId();

    if (isEditing && meetingId) {
      const fullPayload = buildPayloadBase(values);
      if (applyToGroup && belongsToGroup) {
        if (
          hasFutureSiblingsWithMinutes &&
          values.frequency !== meetingData?.frequency
        ) {
          setShowGroupMinutesConfirm(true);
          return;
        }
        setShowGroupConfirm(true);
        return;
      }
      const singlePayload = belongsToGroup
        ? { ...fullPayload, repeatUntil: values.repeatUntil || undefined }
        : fullPayload;
      updateMutation.mutate(
        { id: meetingId, payload: singlePayload },
        {
          onSuccess: () => {
            toast.success("Reunión actualizada");
            onClose();
          },
          onError: () => toast.error("Error al actualizar"),
        },
      );
      return;
    }

    setIsCreating(true);
    try {
      const mkPayload = (overrides: any = {}) => {
        const { startDate, endDate, ...rest } = buildPayloadBase(values);
        return {
          ...rest,
          startDate: overrides.startDate ?? startDate,
          endDate: overrides.endDate ?? endDate,
          companyId: companyId ?? "",
          businessUnitId: businessUnitId ?? undefined,
          ...overrides,
        };
      };
      if (values.frequency === "ONCE") {
        await createMutation.mutateAsync(mkPayload());
        toast.success("Reunión creada");
        onClose();
      } else {
        const bd = new Date(`${values.date}T${values.startTime}:00`);
        const be = new Date(`${values.date}T${values.endTime}:00`);
        const dur = be.getTime() - bd.getTime();
        const cnt = generatedCount || 4;
        const first = await createMutation.mutateAsync(mkPayload());
        const pid = first.id;
        const proms = [];
        for (let i = 1; i < cnt; i++) {
          const nd = addFrequency(bd, values.frequency, i);
          proms.push(
            http.post(
              routes.meetings.base(),
              mkPayload({
                parentId: pid,
                startDate: nd.toISOString(),
                endDate: new Date(nd.getTime() + dur).toISOString(),
              }),
            ),
          );
        }
        await Promise.all(proms);
        queryClient.invalidateQueries({ queryKey: QKEY.meetings });
        toast.success(`${cnt} reuniones creadas`);
        onClose();
      }
    } catch {
      toast.error("Error al crear reuniones");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!meetingId) return;
    setShowDeleteConfirm(false);

    if (applyToGroup && belongsToGroup) {
      try {
        await http.delete(
          `${routes.meetings.byId(meetingId)}?applyToGroup=true`,
        );
        queryClient.invalidateQueries({ queryKey: QKEY.meetings });
        toast.success("Serie cancelada");
        onClose();
      } catch {
        toast.error("Error al cancelar la serie");
      }
      return;
    }

    const minutesCount = (meetingData as any)?._count?.minutes ?? 0;
    if (minutesCount > 0) {
      toast.error("No se puede eliminar porque tiene actas generadas.");
      return;
    }
    deleteMutation.mutate(meetingId, {
      onSuccess: () => {
        toast.success("Reunión eliminada");
        onClose();
      },
      onError: () => toast.error("Error al eliminar"),
    });
  };

  const handleGroupMinutesConfirm = async () => {
    if (!meetingId) return;
    setShowGroupMinutesConfirm(false);
    const values = getValues();
    const fullPayload = buildPayloadBase(values);
    try {
      await http.patch(routes.meetings.byId(meetingId), {
        ...fullPayload,
        applyToGroup: true,
        repeatUntil: values.repeatUntil || undefined,
      });
      queryClient.invalidateQueries({ queryKey: QKEY.meetings });
      toast.success("Reuniones actualizadas");
      onClose();
    } catch {
      toast.error("Error al actualizar el grupo");
    }
  };

  const handleGroupConfirm = async () => {
    if (!meetingId) return;
    setShowGroupConfirm(false);
    const values = getValues();
    const fullPayload = buildPayloadBase(values);
    try {
      await http.patch(routes.meetings.byId(meetingId), {
        ...fullPayload,
        applyToGroup: true,
        repeatUntil: values.repeatUntil || undefined,
      });
      queryClient.invalidateQueries({ queryKey: QKEY.meetings });
      toast.success("Reuniones actualizadas");
      onClose();
    } catch {
      toast.error("Error al actualizar el grupo");
    }
  };

  const isBusy = isSubmitting || isCreating;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-hidden p-0 gap-0 sm:max-w-6xl rounded-2xl">
        <div className="flex max-h-[92vh] flex-col overflow-hidden">
          <div className="relative border-b bg-gradient-to-br from-background via-background to-muted/50 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="rounded-full px-2.5">
                    <Sparkles className="mr-1 h-3 w-3" />
                    {isEditing ? "Edición de reunión" : "Nueva reunión"}
                  </Badge>
                  {readOnly && (
                    <Badge variant="outline" className="rounded-full">
                      Solo lectura
                    </Badge>
                  )}
                  {belongsToGroup && (
                    <Badge variant="outline" className="rounded-full">
                      Serie
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-xl font-semibold tracking-tight">
                  {watchName?.trim() || "Configura los detalles de la reunión"}
                </DialogTitle>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Define la información principal, repetición, participantes y
                  agenda.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-9 w-9 rounded-full shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoadingMeeting && isEditing ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground ml-3">
                Cargando reunión...
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div
                className={`min-h-0 flex-1 overflow-y-auto px-6 py-5 ${readOnly ? "pointer-events-none select-none opacity-70" : ""}`}
              >
                <div className="space-y-5">
                  <SectionCard
                    icon={<CalendarDays className="h-4 w-4" />}
                    title="Información principal"
                    description="Datos base para identificar, programar y justificar la reunión."
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Título de la reunión
                        </Label>
                        <Input
                          {...register("name", { required: true })}
                          placeholder="Ej. Reunión semanal de seguimiento"
                          className="h-11 text-base font-medium"
                        />
                      </div>

                      <div className="flex flex-wrap items-start gap-3">
                        <div className="min-w-[130px] flex-1 space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">
                            Fecha
                          </Label>
                          <div className="relative">
                            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              type="date"
                              {...register("date", { required: true })}
                              className="h-10 pl-9"
                            />
                          </div>
                        </div>
                        <div className="min-w-[110px] flex-1 space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">
                            Hora inicio
                          </Label>
                          <div className="relative">
                            <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              type="time"
                              {...register("startTime", { required: true })}
                              className="h-10 pl-9"
                            />
                          </div>
                        </div>
                        <div className="min-w-[110px] flex-1 space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">
                            Hora fin
                          </Label>
                          <div className="relative">
                            <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              type="time"
                              {...register("endTime", { required: true })}
                              className="h-10 pl-9"
                            />
                          </div>
                        </div>
                        <div className="min-w-[200px] flex-1 space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">
                            Frecuencia
                          </Label>
                          <SelectInput
                            value={frequency}
                            onChange={(v) =>
                              setValue("frequency", v as MeetingFrequency)
                            }
                            options={[
                              { value: "ONCE", label: "Una vez" },
                              { value: "DAILY", label: "Diario" },
                              { value: "WEEKLY", label: "Semanal" },
                              { value: "BIWEEKLY", label: "Quincenal" },
                              { value: "MONTHLY", label: "Mensual" },
                            ]}
                          />
                        </div>

                        {(!isEditing || (isEditing && belongsToGroup)) &&
                          frequency !== "ONCE" && (
                            <div className="min-w-[150px] flex-1 space-y-2">
                              <Label className="text-xs font-medium text-muted-foreground">
                                Repetir hasta
                              </Label>
                              <Input
                                type="date"
                                {...register("repeatUntil")}
                                min={watchDate}
                                className="h-10"
                              />
                            </div>
                          )}

                        {(!isEditing || (isEditing && belongsToGroup)) &&
                          frequency !== "ONCE" &&
                          generatedCount > 0 && (
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-muted-foreground opacity-0">
                                .
                              </Label>
                              <Badge
                                variant="secondary"
                                className="h-10 w-fit rounded-xl px-4 text-sm whitespace-nowrap"
                              >
                                {generatedCount} reuniones
                              </Badge>
                            </div>
                          )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">
                            Lugar o enlace
                          </Label>
                          <div className="relative">
                            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              {...register("location")}
                              placeholder="Sala A, Google Meet, Zoom..."
                              className="h-10 pl-9"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">
                            Herramientas
                          </Label>
                          <div className="relative">
                            <Wrench className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              {...register("tools")}
                              placeholder="Proyector, Miro, tablero..."
                              className="h-10 pl-9"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Propósito
                        </Label>
                        <Textarea
                          {...register("purpose")}
                          placeholder="Ej. Revisar avances, bloqueos y compromisos de la semana."
                          rows={3}
                          className="min-h-[90px] resize-none"
                        />
                      </div>
                    </div>
                  </SectionCard>

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <SectionCard
                      icon={<Users className="h-4 w-4" />}
                      title="Participantes"
                      description="Agrega convocantes y asistentes."
                      className="min-h-[390px]"
                    >
                      <div className="flex min-h-[300px] flex-col">
                        {fields.length === 0 ? (
                          <div className="flex min-h-[230px] flex-1 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-4 py-8 text-center">
                            <UserRound className="mb-2 h-8 w-8 text-muted-foreground/70" />

                            <p className="text-sm font-medium">
                              Sin participantes agregados
                            </p>

                            <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">
                              Agrega al menos un convocante o participante.
                            </p>
                          </div>
                        ) : (
                          <div className="max-h-[330px] space-y-2 overflow-y-auto pr-1">
                            {fields.map((field, index) => {
                              const participant = watchParticipants[index];

                              const selectedUser = selectableUsers.find(
                                (user) => user.id === participant?.userId,
                              );

                              const selectedUserName = selectedUser
                                ? `${selectedUser.firstName} ${selectedUser.lastName}`.trim()
                                : "";

                              return (
                                <div
                                  key={field.id}
                                  className="rounded-2xl border bg-background px-3 py-2 shadow-sm transition-colors hover:bg-muted/20"
                                >
                                  <div className="grid grid-cols-[minmax(150px,1fr)_120px_auto_40px] items-center gap-2">
                                    <Select
                                      value={participant?.userId || ""}
                                      onValueChange={(value) => {
                                        const existingIdx =
                                          watchParticipants.findIndex(
                                            (
                                              currentParticipant,
                                              currentIndex,
                                            ) =>
                                              currentIndex !== index &&
                                              currentParticipant.userId ===
                                                value,
                                          );

                                        if (existingIdx !== -1) {
                                          toast.error(
                                            "El usuario ya está agregado",
                                          );
                                          return;
                                        }

                                        setValue(
                                          `participants.${index}.userId`,
                                          value,
                                        );
                                      }}
                                    >
                                      <SelectTrigger className="h-10 w-full min-w-0 rounded-xl px-3">
                                        <div className="flex min-w-0 flex-1 items-center overflow-hidden">
                                          {selectedUser ? (
                                            <div className="flex min-w-0 flex-col items-start leading-tight">
                                              <span className="block max-w-full truncate text-sm font-medium">
                                                {selectedUserName ||
                                                  selectedUser.email}
                                              </span>

                                              {selectedUser.email && (
                                                <span className="block max-w-full truncate text-[11px] text-muted-foreground">
                                                  {selectedUser.email}
                                                </span>
                                              )}
                                            </div>
                                          ) : (
                                            <SelectValue placeholder="Seleccionar usuario" />
                                          )}
                                        </div>
                                      </SelectTrigger>

                                      <SelectContent>
                                        {selectableUsers.map((user) => (
                                          <SelectItem
                                            key={user.id}
                                            value={user.id}
                                          >
                                            <div className="flex min-w-0 flex-col">
                                              <span className="truncate text-sm font-medium">
                                                {user.firstName} {user.lastName}
                                              </span>

                                              <span className="truncate text-xs text-muted-foreground">
                                                {user.email}
                                              </span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>

                                    <Select
                                      value={participant?.role || "PARTICIPANT"}
                                      onValueChange={(value) =>
                                        setValue(
                                          `participants.${index}.role`,
                                          value as MeetingRole,
                                        )
                                      }
                                    >
                                      <SelectTrigger className="h-10 w-[112px] rounded-xl px-2 text-xs">
                                        <SelectValue placeholder="Tipo" />
                                      </SelectTrigger>

                                      <SelectContent>
                                        <SelectItem value="PARTICIPANT">
                                          Participante
                                        </SelectItem>

                                        <SelectItem value="CONVENER">
                                          Convocante
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>

                                    <Button
                                      type="button"
                                      variant="outline"
                                      title={
                                        participant?.isRequired
                                          ? "Participante obligatorio"
                                          : "Participante no obligatorio"
                                      }
                                      className={`h-10 rounded-xl px-3 text-xs font-medium ${
                                        participant?.isRequired
                                          ? "border-primary/30 text-primary hover:bg-primary/10"
                                          : "text-muted-foreground hover:bg-muted"
                                      }`}
                                      onClick={() =>
                                        setValue(
                                          `participants.${index}.isRequired`,
                                          !participant?.isRequired,
                                        )
                                      }
                                    >
                                      {participant?.isRequired ? (
                                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                      ) : (
                                        <Circle className="mr-1.5 h-3.5 w-3.5" />
                                      )}
                                      Obligatorio
                                    </Button>

                                    {!readOnly && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        title="Eliminar participante"
                                        className="h-10 w-10 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                        onClick={() => remove(index)}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {!readOnly && (
                          <div className="mt-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 rounded-xl"
                              onClick={() =>
                                append({
                                  userId: "",
                                  role: "PARTICIPANT",
                                  isRequired: false,
                                })
                              }
                            >
                              <Plus className="mr-1.5 h-4 w-4" />
                              Agregar participante
                            </Button>
                          </div>
                        )}
                      </div>
                    </SectionCard>

                    <SectionCard
                      icon={<ListChecks className="h-4 w-4" />}
                      title="Agenda"
                      description="Define los puntos que se tratarán."
                      className="min-h-[390px]"
                    >
                      <div className="space-y-3">
                        {(watchAgenda || []).length === 0 ? (
                          <div className="flex min-h-[230px] flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-4 py-8 text-center">
                            <ClipboardList className="mb-2 h-8 w-8 text-muted-foreground/70" />
                            <p className="text-sm font-medium">
                              Sin puntos de agenda
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Agrega los temas principales de la reunión.
                            </p>
                          </div>
                        ) : (
                          <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                            {(watchAgenda || []).map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 rounded-2xl border bg-background px-3 py-2 shadow-sm"
                              >
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                                  {idx + 1}
                                </div>
                                <Input
                                  value={item}
                                  onChange={(e) => {
                                    const a = [...(getValues("agenda") || [])];
                                    a[idx] = e.target.value;
                                    setValue("agenda", a);
                                  }}
                                  placeholder={`Punto ${idx + 1}`}
                                  className="h-9 border-0 px-0 shadow-none focus-visible:ring-0"
                                />
                                {!readOnly && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => {
                                      const a = getValues("agenda") || [];
                                      setValue(
                                        "agenda",
                                        a.filter((_, i) => i !== idx),
                                      );
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {!readOnly && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() =>
                              setValue("agenda", [
                                ...(getValues("agenda") || []),
                                "",
                              ])
                            }
                          >
                            <Plus className="mr-1.5 h-4 w-4" /> Agregar punto
                          </Button>
                        )}
                      </div>
                    </SectionCard>
                  </div>

                  {isEditing && belongsToGroup && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="applyToGroup"
                              checked={applyToGroup}
                              onCheckedChange={(c) =>
                                setValue("applyToGroup", !!c)
                              }
                            />
                            <Label
                              htmlFor="applyToGroup"
                              className="cursor-pointer text-sm font-semibold"
                            >
                              Aplicar cambios a todas las reuniones futuras
                            </Label>
                          </div>
                          <p className="mt-1.5 pl-6 text-xs text-muted-foreground">
                            Esta acción actualizará las reuniones futuras de la
                            serie a partir de esta fecha.
                          </p>
                          {applyToGroup && hasSiblingsWithMinutes && (
                            <div className="mt-2 pl-6">
                              <p className="text-xs font-medium text-amber-700">
                                ⚠️ Las siguientes reuniones tienen actas y no
                                serán modificadas:
                              </p>
                              <ul className="mt-0.5 space-y-0.5 text-xs text-amber-600">
                                {siblingsWithMinutes.map((s) => (
                                  <li key={s.id}>
                                    {new Date(s.startDate).toLocaleDateString(
                                      "es-ES",
                                      { day: "numeric", month: "short" },
                                    )}{" "}
                                    · {s.name}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {applyToGroup && preview && preview.hasAnyChange && (
                            <div className="mt-3 pl-6 space-y-2 text-xs">
                              {preview.keptSiblings.length > 0 && (
                                <div>
                                  <p className="font-semibold text-green-700">
                                    ✓ Se mantendrán (
                                    {preview.keptSiblings.length}):
                                  </p>
                                  <ul className="mt-0.5 space-y-0.5 text-green-600 max-h-[80px] overflow-y-auto">
                                    {preview.keptSiblings
                                      .slice(0, 5)
                                      .map((s: any) => (
                                        <li key={s.id}>
                                          {new Date(
                                            s.startDate,
                                          ).toLocaleDateString("es-ES", {
                                            day: "numeric",
                                            month: "short",
                                          })}{" "}
                                          · {s.name}
                                        </li>
                                      ))}
                                    {preview.keptSiblings.length > 5 && (
                                      <li className="text-muted-foreground">
                                        ... y {preview.keptSiblings.length - 5}{" "}
                                        más
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              )}
                              {preview.cancelledSiblings.length > 0 && (
                                <div>
                                  <p className="font-semibold text-red-600">
                                    ✕ Se cancelarán (
                                    {preview.cancelledSiblings.length}):
                                  </p>
                                  <ul className="mt-0.5 space-y-0.5 text-red-500 max-h-[80px] overflow-y-auto">
                                    {preview.cancelledSiblings
                                      .slice(0, 5)
                                      .map((s: any) => (
                                        <li key={s.id}>
                                          {new Date(
                                            s.startDate,
                                          ).toLocaleDateString("es-ES", {
                                            day: "numeric",
                                            month: "short",
                                          })}{" "}
                                          · {s.name}
                                        </li>
                                      ))}
                                    {preview.cancelledSiblings.length > 5 && (
                                      <li className="text-muted-foreground">
                                        ... y{" "}
                                        {preview.cancelledSiblings.length - 5}{" "}
                                        más
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              )}
                              {preview.newDates.length > 0 && repeatUntil && (
                                <div>
                                  <p className="font-semibold text-blue-700">
                                    + Se crearán ({preview.newDates.length}):
                                  </p>
                                  <ul className="mt-0.5 space-y-0.5 text-blue-600 max-h-[80px] overflow-y-auto">
                                    {preview.newDates
                                      .slice(0, 5)
                                      .map((d: Date, i: number) => (
                                        <li key={i}>
                                          {d.toLocaleDateString("es-ES", {
                                            day: "numeric",
                                            month: "short",
                                          })}
                                        </li>
                                      ))}
                                    {preview.newDates.length > 5 && (
                                      <li className="text-muted-foreground">
                                        ... y {preview.newDates.length - 5} más
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 border-t bg-background px-6 py-4">
                {isEditing && !readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="mr-auto rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash className="mr-1.5 h-4 w-4" />
                    {applyToGroup && belongsToGroup
                      ? "Eliminar serie"
                      : "Eliminar"}
                  </Button>
                )}
                <div className="ml-auto flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="rounded-xl"
                  >
                    Cancelar
                  </Button>
                  {!readOnly && (
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isBusy}
                      className="rounded-xl"
                    >
                      {isBusy && (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      )}
                      {isCreating
                        ? "Creando..."
                        : isEditing
                          ? applyToGroup && belongsToGroup
                            ? "Aplicar cambios al grupo"
                            : "Guardar cambios"
                          : "Crear reunión"}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
      <ConfirmModal
        open={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={
          applyToGroup && belongsToGroup ? "Eliminar serie" : "Eliminar reunión"
        }
        message={
          applyToGroup && belongsToGroup
            ? `Se cancelarán todas las reuniones futuras de la serie. Las reuniones con actas no serán afectadas. ¿Deseas continuar?`
            : "¿Estás seguro de eliminar esta reunión?"
        }
        confirmText={
          applyToGroup && belongsToGroup ? "Eliminar serie" : "Eliminar"
        }
        isDestructive
      />
      <ConfirmModal
        open={showGroupConfirm}
        onCancel={() => setShowGroupConfirm(false)}
        onConfirm={handleGroupConfirm}
        title="Aplicar cambios al grupo"
        message="¿Estás seguro de aplicar estos cambios a todas las reuniones futuras de la serie?"
        confirmText="Aplicar cambios"
      >
        {preview && (
          <div className="space-y-2 text-xs">
            {preview.keptSiblings.length > 0 && (
              <div>
                <p className="font-semibold text-green-700">
                  ✓ Se mantendrán ({preview.keptSiblings.length}):
                </p>
                <ul className="mt-0.5 space-y-0.5 text-green-600 max-h-[80px] overflow-y-auto pl-2">
                  {preview.keptSiblings.slice(0, 5).map((s: any) => (
                    <li key={s.id}>
                      {new Date(s.startDate).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {s.name}
                    </li>
                  ))}
                  {preview.keptSiblings.length > 5 && (
                    <li className="text-muted-foreground">
                      ... y {preview.keptSiblings.length - 5} más
                    </li>
                  )}
                </ul>
              </div>
            )}
            {preview.cancelledSiblings.length > 0 && (
              <div>
                <p className="font-semibold text-red-600">
                  ✕ Se cancelarán ({preview.cancelledSiblings.length}):
                </p>
                <ul className="mt-0.5 space-y-0.5 text-red-500 max-h-[80px] overflow-y-auto pl-2">
                  {preview.cancelledSiblings.slice(0, 5).map((s: any) => (
                    <li key={s.id}>
                      {new Date(s.startDate).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {s.name}
                    </li>
                  ))}
                  {preview.cancelledSiblings.length > 5 && (
                    <li className="text-muted-foreground">
                      ... y {preview.cancelledSiblings.length - 5} más
                    </li>
                  )}
                </ul>
              </div>
            )}
            {preview.newDates.length > 0 && (
              <div>
                <p className="font-semibold text-blue-700">
                  + Se crearán ({preview.newDates.length}):
                </p>
                <ul className="mt-0.5 space-y-0.5 text-blue-600 max-h-[80px] overflow-y-auto pl-2">
                  {preview.newDates.slice(0, 5).map((d: Date, i: number) => (
                    <li key={i}>
                      {d.toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })}
                    </li>
                  ))}
                  {preview.newDates.length > 5 && (
                    <li className="text-muted-foreground">
                      ... y {preview.newDates.length - 5} más
                    </li>
                  )}
                </ul>
              </div>
            )}
            {siblingsWithMinutes.length > 0 && (
              <div>
                <p className="font-semibold text-amber-700">
                  ⚠️ Con actas (no se modificarán):
                </p>
                <ul className="mt-0.5 space-y-0.5 text-amber-600 max-h-[80px] overflow-y-auto pl-2">
                  {siblingsWithMinutes.map((s) => (
                    <li key={s.id}>
                      {new Date(s.startDate).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {s.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </ConfirmModal>
      <ConfirmModal
        open={showGroupMinutesConfirm}
        onCancel={() => setShowGroupMinutesConfirm(false)}
        onConfirm={handleGroupMinutesConfirm}
        title="Cambiar frecuencia"
        message={`Hay reuniones futuras con actas en esta serie y no serán modificadas:\n${siblingsWithMinutes
          .map(
            (s) =>
              `  • ${new Date(s.startDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })} · ${s.name}`,
          )
          .join("\n")}\n\n¿Deseas continuar?`}
        confirmText="Sí, continuar"
      />
    </Dialog>
  );
}
