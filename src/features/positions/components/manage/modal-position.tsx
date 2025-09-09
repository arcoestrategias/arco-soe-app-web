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
import { getCompanyId, getBusinessUnitId } from "@/shared/auth/storage";
import type { Position } from "../../types/positions";
import { Button } from "@/components/ui/button";

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

  // IDs del storage
  const storageCompanyId = getCompanyId() ?? "";
  const storageBUId = getBusinessUnitId() ?? "";

  // Filtrar BUs por compañía del storage (igual que en ModalUser)
  const filteredBUs = React.useMemo(() => {
    if (!storageCompanyId) return businessUnits;
    return businessUnits.filter((b: any) => b.companyId === storageCompanyId);
  }, [businessUnits, storageCompanyId]);

  // RHF
  const {
    handleSubmit,
    register,
    reset,
    setValue,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<PositionFormValues>({
    mode: "onTouched",
    defaultValues: {
      name: "",
      businessUnitId: "",
      userId: "",
      isCeo: false,
    },
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
  });

  // Usuarios por BU seleccionada
  const { users, isLoading: usersLoading } = useBusinessUnitUsers(
    buField.value
  );

  // defaults MEMO – evita recrear objeto en cada render
  const defaults = React.useMemo<PositionFormValues>(() => {
    const buIdForCreate = filteredBUs.some((b: any) => b.id === storageBUId)
      ? storageBUId
      : "";

    return {
      name: position?.name ?? "",
      businessUnitId:
        modo === "crear" ? buIdForCreate : position?.businessUnitId ?? "",
      userId: position?.userId ?? "",
      isCeo: !!position?.isCeo,
    };
  }, [
    modo,
    position?.id,
    position?.name,
    position?.businessUnitId,
    position?.userId,
    position?.isCeo,
    storageBUId,
    filteredBUs.length,
  ]);

  // reset SOLO al abrir / cambiar modo / cambiar registro / cambiar defaults
  useEffect(() => {
    if (!isOpen) return;
    reset(defaults);
  }, [isOpen, modo, position?.id, defaults, reset]);

  // limpiar userId solo cuando la BU CAMBIA realmente (no en cada render)
  const prevBURef = React.useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!isOpen || readOnly) return;

    // primera pasada con modal abierta: registrar valor inicial sin limpiar
    if (prevBURef.current === undefined) {
      prevBURef.current = buField.value;
      return;
    }

    if (prevBURef.current !== buField.value) {
      prevBURef.current = buField.value;
      setValue("userId", "", { shouldDirty: true, shouldValidate: true });
    }
  }, [isOpen, readOnly, buField.value, setValue]);

  const submit = (values: PositionFormValues) => {
    if (readOnly) return;

    const payload: PositionFormValues = {
      name: String(values.name || "").trim(),
      businessUnitId: values.businessUnitId,
      userId: values.userId || "",
      isCeo: !!values.isCeo,
    };

    if (modo === "crear") onSave({ mode: "crear", payload });
    else onSave({ mode: "editar", id: position?.id, payload });
  };

  const usersForSelect = React.useMemo(() => {
    if (
      modo === "editar" &&
      position?.userId &&
      buField.value &&
      position.businessUnitId === buField.value &&
      !users.some((u) => u.id === position.userId)
    ) {
      return [
        {
          id: position.userId,
          firstName: position.userFullName ?? "", // si tienes userFullName, úsalo
          lastName: "",
          email: "", // fallback
        },
        ...users,
      ];
    }
    return users;
  }, [
    modo,
    position?.userId,
    position?.userFullName,
    position?.businessUnitId,
    buField.value,
    users,
  ]);

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

          {/* Unidad de Negocio (¡ahora usa filteredBUs!) */}
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
                <SelectValue
                  placeholder={
                    filteredBUs.length
                      ? "Selecciona una unidad"
                      : "No hay unidades para la compañía seleccionada"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {/* <SelectItem value="">{`— Sin usuario —`}</SelectItem> */}
                {filteredBUs.map((b: any) => (
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
              value={userField.value || undefined}
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
                {usersForSelect.map((u) => (
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
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
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
