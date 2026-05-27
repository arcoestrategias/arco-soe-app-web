"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Loader2, Plus, Trash, X } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ConfirmModal } from "@/shared/components/confirm-modal";

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

import type {
  MeetingOccurrence,
  MeetingFrequency,
  MeetingRole,
} from "../types/meetings.types";

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string | null;
  occurrence: MeetingOccurrence | null;
  initialDate?: Date | null;
}

const WEEK_DAYS = [
  { label: "L", value: 1 },
  { label: "M", value: 2 },
  { label: "X", value: 3 },
  { label: "J", value: 4 },
  { label: "V", value: 5 },
  { label: "S", value: 6 },
  { label: "D", value: 0 },
];

type FormValues = {
  name: string;
  purpose: string;
  location: string;
  tools: string;
  frequency: MeetingFrequency;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  seriesEndDate: string; // YYYY-MM-DD
  participants: {
    userId: string;
    role: MeetingRole;
    isRequired: boolean;
  }[];
  scope: "ONLY_THIS" | "THIS_AND_FUTURE";
  daysOfWeek: number[];
  agenda: string[];
};

export function MeetingModal({
  isOpen,
  onClose,
  meetingId,
  occurrence,
  initialDate,
}: MeetingModalProps) {
  const { me } = useAuth();
  const canManageAny = usePermission(PERMISSIONS.MEETINGS.MANAGE);
  const isEditing = !!meetingId;
  const isOccurrenceEdit = !!occurrence;

  // Queries y Mutaciones
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
  const [convenerConflict, setConvenerConflict] = useState<{
    fromIndex: number;
    toIndex: number;
    fromName: string;
    toName: string;
  } | null>(null);

  // Usuarios para el selector
  const { groups } = useMeetingCandidates();
  const allUsers = useMemo(() => {
    return groups.flatMap((g) => g.users);
  }, [groups]);

  // Combinar usuarios del catálogo con los que vienen en la reunión
  // para asegurar que se muestren aunque no estén en la lista cargada (ej. inactivos o de otra BU)
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

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      purpose: "",
      location: "",
      tools: "",
      frequency: "ONCE",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "10:00",
      participants: [],
      scope: "ONLY_THIS",
      daysOfWeek: [],
      agenda: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "participants",
  });

  // Cargar datos al editar
  useEffect(() => {
    if (isOpen && meetingData) {
      // Si editamos una ocurrencia, usamos su fecha. Si no, la de la serie.
      const baseDate =
        isOccurrenceEdit && occurrence
          ? parseISO(occurrence.start)
          : parseISO(meetingData.startDate);

      const endDate =
        isOccurrenceEdit && occurrence
          ? parseISO(occurrence.end)
          : parseISO(meetingData.endDate);

      reset({
        name: meetingData.name,
        purpose: meetingData.purpose || "",
        location: meetingData.location || "",
        tools: meetingData.tools || "",
        frequency: meetingData.frequency,
        date: format(baseDate, "yyyy-MM-dd"),
        startTime: format(baseDate, "HH:mm"),
        endTime: format(endDate, "HH:mm"),
        seriesEndDate: meetingData.seriesEndDate
          ? format(parseISO(meetingData.seriesEndDate), "yyyy-MM-dd")
          : "",
        participants: (meetingData.participants || []).map((p) => ({
          userId: p.userId,
          role: p.role,
          isRequired: p.isRequired,
        })),
        scope: "ONLY_THIS",
        daysOfWeek: meetingData.daysOfWeek ?? [],
        agenda: meetingData.agenda ?? [],
      });
    } else if (isOpen && !isEditing) {
      reset({
        name: "",
        frequency: "ONCE",
        date: initialDate
          ? format(initialDate, "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd"),
        startTime: "09:00",
        endTime: "10:00",
        participants: [],
        daysOfWeek: [],
        agenda: [],
      });
    }
  }, [
    isOpen,
    meetingData,
    isEditing,
    isOccurrenceEdit,
    occurrence,
    reset,
    initialDate,
  ]);

  const onSubmit = (values: FormValues) => {
    if (readOnly) {
      onClose();
      return;
    }

    // IDs de contexto
    const companyId = getCompanyId();
    const businessUnitId = getBusinessUnitId();

    // Construir fechas ISO
    const startIso = `${values.date}T${values.startTime}:00.000Z`;
    const endIso = `${values.date}T${values.endTime}:00.000Z`;

    // Payload base
    const payload: any = {
      name: values.name,
      purpose: values.purpose,
      location: values.location,
      tools: values.tools,
      frequency: values.frequency,
      startDate: new Date(startIso).toISOString(),
      endDate: new Date(endIso).toISOString(),
      seriesEndDate: values.seriesEndDate
        ? new Date(values.seriesEndDate).toISOString()
        : undefined,
      participants: values.participants,
      // 👇 NUEVOS CAMPOS REQUERIDOS
      companyId: companyId,
      businessUnitId: businessUnitId,
      daysOfWeek: values.frequency === "WEEKLY" ? values.daysOfWeek : undefined,
      agenda: values.agenda?.length ? values.agenda : undefined,
    };

    if (isEditing && meetingId) {
      // Si es edición de ocurrencia, agregamos scope y occurrenceDate
      if (isOccurrenceEdit && occurrence) {
        payload.scope = values.scope;
        payload.occurrenceDate = occurrence.start; // Fecha original para identificar la ocurrencia
      }

      updateMutation.mutate(
        { id: meetingId, payload },
        {
          onSuccess: () => {
            toast.success("Reunión actualizada");
            onClose();
          },
          onError: () => toast.error("Error al actualizar"),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Reunión creada");
          onClose();
        },
        onError: () => toast.error("Error al crear"),
      });
    }
  };

  const handleDelete = () => {
    if (!meetingId) return;

    // Si estamos editando una ocurrencia específica, por defecto eliminamos solo esa.
    // Si es la serie completa (o no es recurrente), eliminamos la serie.
    const scope = isOccurrenceEdit ? "ONLY_THIS" : "SERIES";
    const occurrenceDate =
      isOccurrenceEdit && occurrence ? occurrence.start : undefined;

    deleteMutation.mutate(
      {
        id: meetingId,
        params: { scope, occurrenceDate },
      },
      {
        onSuccess: () => {
          toast.success("Reunión eliminada");
          onClose();
        },
        onError: () => toast.error("Error al eliminar la reunión"),
      },
    );
  };

  const frequency = watch("frequency");
  const daysOfWeek = watch("daysOfWeek");

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <div className="sticky top-0 bg-background z-10 border-b px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isEditing ? "Editar Reunión" : "Nueva Reunión"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {isEditing
                ? "Modifica los datos de la reunión"
                : "Configura los detalles de la nueva reunión"}
            </p>
          </DialogHeader>
        </div>

        {isLoadingMeeting && isEditing ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="px-6 py-4 space-y-6"
          >
            <div
              className={
                readOnly ? "pointer-events-none opacity-70 select-none" : ""
              }
            >
              {/* Section: Meeting Details */}
              <div className="rounded-lg border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <div className="h-1 w-4 rounded-full bg-primary" />
                  Información general
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-4 space-y-1.5">
                    <Label className="text-sm font-medium">
                      Nombre de la reunión
                    </Label>
                    <Input
                      {...register("name", { required: true })}
                      placeholder="Ej: Comité de Riesgo Q2"
                      className="h-10"
                    />
                    {errors.name && (
                      <span className="text-xs text-red-500">
                        El nombre es requerido
                      </span>
                    )}
                  </div>

                  <div className="col-span-4 space-y-1.5">
                    <Label className="text-sm font-medium">Propósito</Label>
                    <Textarea
                      {...register("purpose")}
                      placeholder="Describe el propósito de la reunión..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Ubicación</Label>
                    <Input
                      {...register("location")}
                      placeholder="Ej: Sala Ejecutiva 3 / Google Meet"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Herramientas</Label>
                    <Input
                      {...register("tools")}
                      placeholder="Ej: Jira, Miro, Power BI"
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Date & Time */}
              <div className="rounded-lg border bg-card p-5 space-y-4 mt-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <div className="h-1 w-4 rounded-full bg-primary" />
                  Fecha y hora
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Fecha</Label>
                    <Input
                      type="date"
                      {...register("date", { required: true })}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Hora inicio</Label>
                    <Input
                      type="time"
                      {...register("startTime", { required: true })}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Hora fin</Label>
                    <Input
                      type="time"
                      {...register("endTime", { required: true })}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Frecuencia</Label>
                    <Controller
                      control={control}
                      name="frequency"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ONCE">Una vez</SelectItem>
                            <SelectItem value="DAILY">Diario</SelectItem>
                            <SelectItem value="WEEKLY">Semanal</SelectItem>
                            <SelectItem value="BIWEEKLY">Quincenal</SelectItem>
                            <SelectItem value="MONTHLY">Mensual</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {frequency === "WEEKLY" && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      Días de la semana
                    </Label>
                    <div className="flex gap-1.5">
                      {WEEK_DAYS.map((day) => {
                        const isSelected = (daysOfWeek || []).includes(
                          day.value,
                        );
                        return (
                          <Button
                            key={day.value}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className={`w-9 h-9 p-0 text-xs font-medium ${
                              isSelected ? "" : "text-muted-foreground"
                            }`}
                            onClick={() => {
                              const current = getValues("daysOfWeek") || [];
                              const newDays = isSelected
                                ? current.filter((d) => d !== day.value)
                                : [...current, day.value];
                              setValue("daysOfWeek", newDays);
                            }}
                          >
                            {day.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {frequency !== "ONCE" && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      Repetir hasta{" "}
                      {frequency === "DAILY" ? (
                        <span className="text-destructive">(obligatorio)</span>
                      ) : (
                        <span className="text-muted-foreground">
                          (opcional)
                        </span>
                      )}
                    </Label>
                    <Input
                      type="date"
                      {...register("seriesEndDate", {
                        required: frequency === "DAILY",
                      })}
                      className="h-10 w-56"
                    />
                  </div>
                )}
              </div>

              {/* Section: Agenda */}
              <div className="rounded-lg border bg-card p-5 space-y-3 mt-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <div className="h-1 w-4 rounded-full bg-primary" />
                  Agenda del día
                </div>
                <Controller
                  control={control}
                  name="agenda"
                  render={({ field }) => (
                    <div className="space-y-2">
                      {(field.value ?? []).map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground shrink-0">
                            {i + 1}
                          </div>
                          <Input
                            value={item}
                            onChange={(e) => {
                              const next = [...(field.value ?? [])];
                              next[i] = e.target.value;
                              field.onChange(next);
                            }}
                            placeholder="Punto de agenda..."
                            className="h-9"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={() => {
                              const next = (field.value ?? []).filter(
                                (_, j) => j !== i,
                              );
                              field.onChange(next);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() =>
                          field.onChange([...(field.value ?? []), ""])
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" /> Agregar punto
                      </Button>
                    </div>
                  )}
                />
              </div>

              {/* Section: Participants */}
              <div className="rounded-lg border bg-card p-5 space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="h-1 w-4 rounded-full bg-primary" />
                    Participantes
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {fields.length} participante{fields.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20"
                    >
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-xs font-semibold text-primary shrink-0">
                        {index + 1}
                      </div>
                      <Controller
                        control={control}
                        name={`participants.${index}.userId`}
                        rules={{ required: true }}
                        render={({ field: f }) => (
                          <Select value={f.value} onValueChange={f.onChange}>
                            <SelectTrigger className="flex-1 h-9 min-w-0">
                              <SelectValue placeholder="Seleccionar usuario" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectableUsers.map((u) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.firstName} {u.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <Controller
                        control={control}
                        name={`participants.${index}.role`}
                        render={({ field: f }) => (
                          <Select
                            value={f.value}
                            onValueChange={(value) => {
                              if (value === "CONVENER") {
                                const existingIdx = fields.findIndex(
                                  (_, i) =>
                                    i !== index &&
                                    getValues(`participants.${i}.role`) ===
                                      "CONVENER" &&
                                    getValues(`participants.${i}.userId`),
                                );

                                if (existingIdx !== -1) {
                                  const existingUserId = getValues(
                                    `participants.${existingIdx}.userId`,
                                  );
                                  const existingUser = selectableUsers.find(
                                    (u) => u.id === existingUserId,
                                  );
                                  const newUserId = getValues(
                                    `participants.${index}.userId`,
                                  );
                                  const newUser = selectableUsers.find(
                                    (u) => u.id === newUserId,
                                  );

                                  const existingName = existingUser
                                    ? `${existingUser.firstName} ${existingUser.lastName}`
                                    : "el usuario actual";
                                  const newName = newUser
                                    ? `${newUser.firstName} ${newUser.lastName}`
                                    : "el nuevo usuario";

                                  setConvenerConflict({
                                    fromIndex: existingIdx,
                                    toIndex: index,
                                    fromName: existingName,
                                    toName: newName,
                                  });
                                  return;
                                }
                              }
                              f.onChange(value);
                            }}
                          >
                            <SelectTrigger className="w-[130px] h-9">
                              <SelectValue />
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
                        )}
                      />
                      <Controller
                        control={control}
                        name={`participants.${index}.isRequired`}
                        render={({ field: f }) => (
                          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded border bg-background shrink-0">
                            <Checkbox
                              id={`req-${index}`}
                              checked={f.value}
                              onCheckedChange={f.onChange}
                              className="h-3.5 w-3.5"
                            />
                            <Label
                              htmlFor={`req-${index}`}
                              className="text-xs cursor-pointer text-muted-foreground"
                            >
                              Oblig.
                            </Label>
                          </div>
                        )}
                      />
                      {!readOnly && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-destructive"
                          onClick={() => remove(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {!readOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        userId: "",
                        role: "PARTICIPANT",
                        isRequired: false,
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" /> Agregar participante
                  </Button>
                )}
              </div>

              {/* Section: Occurrence Scope */}
              {isOccurrenceEdit && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 space-y-3 mt-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 uppercase tracking-wider">
                    <div className="h-1 w-4 rounded-full bg-amber-500" />
                    Aplicar cambios a
                  </div>
                  <Controller
                    control={control}
                    name="scope"
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ONLY_THIS" id="r1" />
                          <Label
                            htmlFor="r1"
                            className="text-sm cursor-pointer"
                          >
                            Solo esta reunión
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="THIS_AND_FUTURE" id="r2" />
                          <Label
                            htmlFor="r2"
                            className="text-sm cursor-pointer"
                          >
                            Esta y futuras
                          </Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="border-t pt-4 pb-2 sticky bottom-0 bg-background gap-2">
              {isEditing && !readOnly && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="mr-auto"
                >
                  Eliminar reunión
                </Button>
              )}
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="btn-gradient"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {readOnly ? "Cerrar" : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        )}

        <ConfirmModal
          open={showDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          title="Eliminar Reunión"
          message={
            isOccurrenceEdit
              ? "¿Estás seguro de eliminar esta ocurrencia de la reunión?"
              : "¿Estás seguro de eliminar esta reunión? Si es una serie, se eliminarán todas las ocurrencias futuras."
          }
          confirmText="Eliminar"
          isDestructive
        />

        <ConfirmModal
          open={!!convenerConflict}
          onCancel={() => setConvenerConflict(null)}
          onConfirm={() => {
            if (convenerConflict) {
              setValue(
                `participants.${convenerConflict.fromIndex}.role`,
                "PARTICIPANT",
              );
              setValue(
                `participants.${convenerConflict.toIndex}.role`,
                "CONVENER",
              );
              setConvenerConflict(null);
            }
          }}
          title="Cambiar convocante"
          message={`${convenerConflict?.fromName} ya es convocante. ¿Quieres cambiar el convocante a ${convenerConflict?.toName}?`}
          confirmText="Sí, cambiar"
        />
      </DialogContent>
    </Dialog>
  );
}
