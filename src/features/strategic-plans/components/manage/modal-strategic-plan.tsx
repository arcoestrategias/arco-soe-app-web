"use client";

import * as React from "react";
import { useEffect } from "react";
import { useForm, Controller, useController } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";

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
import { Textarea } from "@/components/ui/textarea";
import { ActionButton } from "@/components/ui/action-button";
import { Switch } from "@/components/ui/switch";

import { getBusinessUnitsByCompany } from "@/features/business-units/services/businessUnitsService";
import { getCompanyId } from "@/shared/auth/storage";

import type {
  StrategicPlan,
  CreateStrategicPlanPayload,
  UpdateStrategicPlanPayload,
} from "../../types/types";

type ModalMode = "crear" | "editar" | "ver";

type Props = {
  isOpen: boolean;
  modo: ModalMode;
  plan: StrategicPlan | null;
  onClose: () => void;
  onSave: (r: {
    mode: Exclude<ModalMode, "ver">;
    id?: string;
    payload: CreateStrategicPlanPayload | UpdateStrategicPlanPayload;
  }) => void;
};

const fmtTitle = (m: ModalMode) =>
  m === "crear"
    ? "Nuevo Plan Estratégico"
    : m === "editar"
    ? "Editar Plan Estratégico"
    : "Detalle del Plan Estratégico";

const toDateInput = (isoOrDate?: string | null) => {
  if (!isoOrDate) return "";
  try {
    const d = new Date(isoOrDate);
    if (Number.isNaN(d.getTime())) return String(isoOrDate).slice(0, 10);
    return d.toISOString().slice(0, 10);
  } catch {
    return String(isoOrDate).slice(0, 10);
  }
};

export type StrategicPlanForm = {
  name: string;
  description?: string | null;
  fromAt: string; // YYYY-MM-DD
  untilAt: string; // YYYY-MM-DD
  businessUnitId: string;
  isActive?: boolean;
};

export function ModalStrategicPlan({
  isOpen,
  modo,
  plan,
  onClose,
  onSave,
}: Props) {
  const readOnly = modo === "ver";

  const companyId = getCompanyId();
  const { data: businessUnits = [], isPending: isLoadingBUs } = useQuery({
    queryKey: ["business-units", "company", String(companyId ?? "none")],
    queryFn: () =>
      companyId ? getBusinessUnitsByCompany(companyId) : Promise.resolve([]),
    enabled: !!companyId,
    staleTime: 60_000,
  });

  const defaults: StrategicPlanForm = {
    name: plan?.name ?? "",
    description: plan?.description ?? "",
    fromAt: toDateInput(plan?.fromAt),
    untilAt: toDateInput(plan?.untilAt),
    businessUnitId: plan?.businessUnitId ?? "",
    isActive: plan?.isActive ?? true,
  };

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<StrategicPlanForm>({
    mode: "onTouched",
    defaultValues: defaults,
  });

  // controller para Select de BU
  const { field: buField } = useController({
    name: "businessUnitId",
    control,
    rules:
      modo !== "ver"
        ? { required: "Selecciona una unidad de negocio" }
        : undefined,
  });

  useEffect(() => {
    reset(defaults);
    // preseleccionar primera BU en "crear" si no hay valor
    if (modo === "crear" && !defaults.businessUnitId && businessUnits.length) {
      setValue("businessUnitId", businessUnits[0].id, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, modo, plan?.id, businessUnits.length]);

  const submit = (values: StrategicPlanForm) => {
    if (modo === "ver") return;

    const base = {
      name: String(values.name || "").trim(),
      description: values.description?.trim() || undefined,
      fromAt: values.fromAt,
      untilAt: values.untilAt,
      businessUnitId: values.businessUnitId,
    };

    if (modo === "crear") {
      const payload: CreateStrategicPlanPayload = base;
      onSave({ mode: "crear", payload });
    } else {
      const payload: UpdateStrategicPlanPayload = {
        ...base,
        isActive: values.isActive,
      };
      onSave({ mode: "editar", id: plan?.id, payload });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{fmtTitle(modo)}</DialogTitle>
          <DialogDescription>
            {modo === "crear"
              ? "Completa los datos para registrar un nuevo plan estratégico."
              : modo === "editar"
              ? "Actualiza los datos del plan estratégico."
              : "Consulta la información del plan estratégico."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(submit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* --- Sección: Datos principales --- */}
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              maxLength={150}
              disabled={readOnly || isSubmitting}
              {...register("name", {
                required: "Requerido",
                maxLength: { value: 150, message: "Máx 150" },
              })}
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label>Unidad de Negocio *</Label>
            <div className="w-full">
              <select
                name="businessUnitId"
                className="w-full h-10 border rounded-md px-3 bg-background"
                value={buField.value ?? ""}
                onChange={(e) => buField.onChange(e.target.value)}
                disabled={
                  readOnly || isSubmitting || isLoadingBUs || !companyId
                }
              >
                <option value="" disabled>
                  {!companyId
                    ? "Seleccione una compañía primero"
                    : isLoadingBUs
                    ? "Cargando unidades…"
                    : "Seleccione una unidad"}
                </option>
                {businessUnits.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.businessUnitId && (
              <p className="text-xs text-red-600">
                {errors.businessUnitId.message as string}
              </p>
            )}
          </div>

          {/* --- Sección: Fechas --- */}
          <div className="space-y-2">
            <Label htmlFor="fromAt">Fecha desde *</Label>
            <Input
              id="fromAt"
              type="date"
              disabled={readOnly || isSubmitting}
              {...register("fromAt", { required: "Requerido" })}
            />
            {errors.fromAt && (
              <p className="text-xs text-red-600">
                {errors.fromAt.message as string}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="untilAt">Fecha hasta *</Label>
            <Input
              id="untilAt"
              type="date"
              disabled={readOnly || isSubmitting}
              {...register("untilAt", { required: "Requerido" })}
            />
            {errors.untilAt && (
              <p className="text-xs text-red-600">
                {errors.untilAt.message as string}
              </p>
            )}
          </div>

          {/* --- Sección: Descripción --- */}
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              maxLength={500}
              disabled={readOnly || isSubmitting}
              {...register("description")}
            />
          </div>

          {/* --- Sección: Estado (solo editar) --- */}
          {modo === "editar" && (
            <div className="md:col-span-2 flex items-center justify-between border rounded-md p-3">
              <div className="space-y-1">
                <Label htmlFor="isActive">Activo</Label>
                <p className="text-xs text-muted-foreground">
                  Habilita o deshabilita este plan estratégico.
                </p>
              </div>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Switch
                    id="isActive"
                    checked={!!field.value}
                    onCheckedChange={(v) => field.onChange(v)}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>
          )}

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
