"use client";

import * as React from "react";
import { useEffect, useMemo } from "react";
import { useForm, Controller, useController } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";

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

import { getBusinessUnits } from "@/features/business-units/services/businessUnitsService";
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
    // Acepta ISO o 'YYYY-MM-DD'; devolvemos 'YYYY-MM-DD'
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
  period: number | string;
  fromAt: string; // YYYY-MM-DD
  untilAt: string; // YYYY-MM-DD
  mission?: string | null;
  vision?: string | null;
  competitiveAdvantage?: string | null;
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

  const { data: businessUnits = [] } = useQuery({
    queryKey: QKEY.businessUnits,
    queryFn: getBusinessUnits,
  });

  const defaults: StrategicPlanForm = {
    name: plan?.name ?? "",
    description: plan?.description ?? "",
    period: plan?.period ?? "",
    fromAt: toDateInput(plan?.fromAt),
    untilAt: toDateInput(plan?.untilAt),
    mission: plan?.mission ?? "",
    vision: plan?.vision ?? "",
    competitiveAdvantage: plan?.competitiveAdvantage ?? "",
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
    // preseleccionar primera BU en crear si no hay valor
    if (modo === "crear" && !defaults.businessUnitId && businessUnits.length) {
      setValue("businessUnitId", businessUnits[0].id, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, modo, plan?.id]);

  const submit = (values: StrategicPlanForm) => {
    if (modo === "ver") return;

    const base = {
      name: String(values.name || "").trim(),
      description: values.description?.trim() || undefined,
      period: Number(values.period),
      fromAt: values.fromAt,
      untilAt: values.untilAt,
      mission: values.mission?.trim() || undefined,
      vision: values.vision?.trim() || undefined,
      competitiveAdvantage: values.competitiveAdvantage?.trim() || undefined,
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
      <DialogContent className="sm:max-w-2xl">
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
          <div className="space-y-2">
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

          <div className="space-y-2">
            <Label htmlFor="period">Período *</Label>
            <Input
              id="period"
              type="number"
              inputMode="numeric"
              disabled={readOnly || isSubmitting}
              {...register("period", { required: "Requerido" })}
            />
            {errors.period && (
              <p className="text-xs text-red-600">
                {errors.period.message as string}
              </p>
            )}
          </div>

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

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              maxLength={500}
              disabled={readOnly || isSubmitting}
              {...register("description")}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="mission">Misión</Label>
            <Textarea
              id="mission"
              maxLength={500}
              disabled={readOnly || isSubmitting}
              {...register("mission")}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="vision">Visión</Label>
            <Textarea
              id="vision"
              maxLength={500}
              disabled={readOnly || isSubmitting}
              {...register("vision")}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="competitiveAdvantage">Ventaja competitiva</Label>
            <Textarea
              id="competitiveAdvantage"
              maxLength={250}
              disabled={readOnly || isSubmitting}
              {...register("competitiveAdvantage")}
            />
          </div>

          {/* Select Unidad de Negocio */}
          <div className="space-y-2 md:col-span-2">
            <Label>Unidad de Negocio *</Label>
            <div className="w-full">
              <select
                className="w-full h-10 border rounded-md px-3 bg-background"
                value={buField.value ?? ""}
                onChange={(e) => buField.onChange(e.target.value)}
                disabled={readOnly || isSubmitting}
              >
                <option value="" disabled>
                  Selecciona una unidad
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
                    onCheckedChange={(v) => field.onChange(v)} // marca el form como dirty
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
