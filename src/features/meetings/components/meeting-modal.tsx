"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Loader2, Plus, Trash } from "lucide-react";
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
import { useUsers } from "@/features/users/hooks/use-users";
import { getCompanyId, getBusinessUnitId } from "@/shared/auth/storage";

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
};

export function MeetingModal({
  isOpen,
  onClose,
  meetingId,
  occurrence,
  initialDate,
}: MeetingModalProps) {
  const isEditing = !!meetingId;
  const isOccurrenceEdit = !!occurrence;

  // Queries y Mutaciones
  const { data: meetingData, isLoading: isLoadingMeeting } =
    useMeetingByIdQuery(meetingId);
  const createMutation = useCreateMeetingMutation();
  const updateMutation = useUpdateMeetingMutation();
  const deleteMutation = useDeleteMeetingMutation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Usuarios para el selector
  const { groups } = useUsers();
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
        }
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
      }
    );
  };

  const frequency = watch("frequency");
  const daysOfWeek = watch("daysOfWeek");

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Reunión" : "Nueva Reunión"}
          </DialogTitle>
        </DialogHeader>

        {isLoadingMeeting && isEditing ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nombre</Label>
                <Input {...register("name", { required: true })} />
                {errors.name && (
                  <span className="text-xs text-red-500">Requerido</span>
                )}
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Propósito</Label>
                <Textarea {...register("purpose")} />
              </div>

              <div className="space-y-2">
                <Label>Ubicación</Label>
                <Input
                  {...register("location")}
                  placeholder="Ej: Sala 1 / Meet"
                />
              </div>

              <div className="space-y-2">
                <Label>Herramientas</Label>
                <Input {...register("tools")} placeholder="Ej: Jira, Miro" />
              </div>

              <div className="space-y-2">
                <Label>Frecuencia</Label>
                <Controller
                  control={control}
                  name="frequency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
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

              {frequency === "WEEKLY" && (
                <div className="col-span-2 space-y-2">
                  <Label>Días de la semana</Label>
                  <div className="flex gap-2">
                    {WEEK_DAYS.map((day) => {
                      const isSelected = (daysOfWeek || []).includes(day.value);
                      return (
                        <Button
                          key={day.value}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className="w-8 h-8 p-0"
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

              <div className="space-y-2">
                <Label>Fecha Inicio</Label>
                <Input type="date" {...register("date", { required: true })} />
              </div>

              <div className="space-y-2">
                <Label>Hora Inicio</Label>
                <Input
                  type="time"
                  {...register("startTime", { required: true })}
                />
              </div>

              <div className="space-y-2">
                <Label>Hora Fin</Label>
                <Input
                  type="time"
                  {...register("endTime", { required: true })}
                />
              </div>

              {frequency !== "ONCE" && (
                <div className="col-span-2 space-y-2">
                  <Label>
                    Repetir hasta{" "}
                    {frequency === "DAILY" ? "(obligatorio)" : "(opcional)"}
                  </Label>
                  <Input
                    type="date"
                    {...register("seriesEndDate", {
                      required: frequency === "DAILY",
                    })}
                  />
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Participantes</Label>
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
                  <Plus className="h-4 w-4 mr-2" /> Agregar
                </Button>
              </div>

              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <Controller
                      control={control}
                      name={`participants.${index}.userId`}
                      rules={{ required: true }}
                      render={({ field: f }) => (
                        <Select value={f.value} onValueChange={f.onChange}>
                          <SelectTrigger className="flex-1">
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
                        <Select value={f.value} onValueChange={f.onChange}>
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PARTICIPANT">
                              Participante
                            </SelectItem>
                            <SelectItem value="CONVENER">Convocante</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <Controller
                      control={control}
                      name={`participants.${index}.isRequired`}
                      render={({ field: f }) => (
                        <div className="flex items-center space-x-2 border rounded px-2 py-2 bg-muted/20">
                          <Checkbox
                            id={`req-${index}`}
                            checked={f.value}
                            onCheckedChange={f.onChange}
                          />
                          <Label
                            htmlFor={`req-${index}`}
                            className="text-xs cursor-pointer"
                          >
                            Obligatorio
                          </Label>
                        </div>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {isOccurrenceEdit && (
              <div className="bg-muted/50 p-4 rounded-md space-y-2">
                <Label>Aplicar cambios a:</Label>
                <Controller
                  control={control}
                  name="scope"
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ONLY_THIS" id="r1" />
                        <Label htmlFor="r1">Solo esta reunión</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="THIS_AND_FUTURE" id="r2" />
                        <Label htmlFor="r2">Esta y futuras</Label>
                      </div>
                    </RadioGroup>
                  )}
                />
              </div>
            )}

            <DialogFooter>
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="mr-auto"
                >
                  Eliminar
                </Button>
              )}
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Guardar
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
      </DialogContent>
    </Dialog>
  );
}
