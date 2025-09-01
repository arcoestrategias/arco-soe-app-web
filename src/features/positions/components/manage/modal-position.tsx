"use client";

import * as React from "react";
import { useEffect } from "react";
import { useForm, Controller, useController } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ActionButton } from "@/components/ui/action-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import { getBusinessUnits } from "@/features/business-units/services/businessUnitsService";
import { useBusinessUnitUsers } from "@/features/business-units/hooks/use-business-unit-users";
import type { Position } from "../../types/positions";

type ModalMode = "crear" | "editar" | "ver";

export type PositionFormValues = {
  name: string;
  businessUnitId: string;
  userId: string;
  isCeo: boolean;
};

type Props = {
  isOpen: boolean;
  modo: ModalMode;
  position: Position | null;
  onClose: () => void;
  onSave: (r: {
    mode: Exclude<ModalMode, "ver">;
    id?: string;
    payload: PositionFormValues;
  }) => void;
};

const fmtTitle = (m: ModalMode) =>
  m === "crear"
    ? "Nueva Posición"
    : m === "editar"
    ? "Editar Posición"
    : "Detalle de Posición";

export function ModalPosition({
  isOpen,
  modo,
  position,
  onClose,
  onSave,
}: Props) {
  const readOnly = modo === "ver";

  // Catálogo: Unidades de Negocio
  const { data: businessUnits = [] } = useQuery({
    queryKey: QKEY.businessUnits,
    queryFn: getBusinessUnits,
    staleTime: 60_000,
    enabled: isOpen,
  });

  // RHF
  const defaults: PositionFormValues = {
    name: position?.name ?? "",
    businessUnitId: position?.businessUnitId ?? "",
    userId: position?.userId ?? "",
    isCeo: !!position?.isCeo,
  };

  const {
    handleSubmit,
    register,
    reset,
    setValue,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<PositionFormValues>({
    mode: "onTouched",
    defaultValues: defaults,
  });

  // Controllers para Selects
  const { field: buField } = useController({
    name: "businessUnitId",
    control,
    rules: !readOnly
      ? { required: "Selecciona una unidad de negocio" }
      : undefined,
  });

  const { field: userField } = useController({
    name: "userId",
    control,
    rules: !readOnly ? { required: "Selecciona un usuario" } : undefined,
  });

  // Usuarios por BU seleccionada
  const { users, isLoading: usersLoading } = useBusinessUnitUsers(
    buField.value
  );

  // Reset al abrir/cambiar registro/modo
  useEffect(() => {
    reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, modo, position?.id]);

  // Si cambias BU y no hay user seleccionado, limpia userId
  useEffect(() => {
    if (!isOpen || readOnly) return;
    setValue("userId", "", { shouldDirty: true, shouldValidate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buField.value]);

  const submit = (values: PositionFormValues) => {
    if (readOnly) return;

    const payload: PositionFormValues = {
      name: String(values.name || "").trim(),
      businessUnitId: values.businessUnitId,
      userId: values.userId,
      isCeo: !!values.isCeo,
    };

    if (modo === "crear") onSave({ mode: "crear", payload });
    else onSave({ mode: "editar", id: position?.id, payload });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{fmtTitle(modo)}</DialogTitle>
          <DialogDescription>
            {modo === "crear"
              ? "Completa los datos para registrar una nueva posición."
              : modo === "editar"
              ? "Actualiza los datos de la posición."
              : "Consulta la información de la posición."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(submit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Nombre */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              maxLength={150}
              disabled={readOnly || isSubmitting}
              {...register("name", { required: "Requerido" })}
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Unidad de Negocio */}
          <div className="space-y-2">
            <Label>Unidad de negocio *</Label>
            <Select
              value={buField.value ?? ""}
              onValueChange={(v) =>
                setValue("businessUnitId", v, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              disabled={readOnly || isSubmitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una unidad" />
              </SelectTrigger>
              <SelectContent>
                {businessUnits.map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.businessUnitId && (
              <p className="text-xs text-red-600">
                {errors.businessUnitId.message as string}
              </p>
            )}
          </div>

          {/* Usuario (filtrado por BU) */}
          <div className="space-y-2">
            <Label>Usuario asignado *</Label>
            <Select
              value={userField.value ?? ""}
              onValueChange={(v) =>
                setValue("userId", v, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              disabled={
                readOnly || isSubmitting || !buField.value || usersLoading
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    !buField.value
                      ? "Selecciona primero la unidad"
                      : usersLoading
                      ? "Cargando usuarios…"
                      : "Selecciona un usuario"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.firstName && u.lastName
                      ? `${u.firstName} ${u.lastName}`
                      : u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.userId && (
              <p className="text-xs text-red-600">
                {errors.userId.message as string}
              </p>
            )}
          </div>

          {/* ¿Es CEO? */}
          <div className="md:col-span-2 flex items-center justify-between border rounded-md p-3">
            <div className="space-y-1">
              <Label htmlFor="isCeo">¿Es CEO?</Label>
              <p className="text-xs text-muted-foreground">
                Marca si la posición corresponde al CEO de la unidad.
              </p>
            </div>
            <Controller
              control={control}
              name="isCeo"
              render={({ field }) => (
                <Switch
                  id="isCeo"
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                  disabled={readOnly || isSubmitting}
                />
              )}
            />
          </div>

          <DialogFooter className="md:col-span-2 mt-4">
            <ActionButton
              label={readOnly ? "Cerrar" : "Cancelar"}
              variant="outline"
              onAction={onClose}
            />
            {!readOnly && (
              <ActionButton
                type="submit"
                className="btn-gradient"
                label={modo === "crear" ? "Registrar" : "Actualizar"}
                loading={isSubmitting}
                disabled={isSubmitting || (modo === "editar" && !isDirty)}
              />
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
