"use client";

import * as React from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { BusinessUnit } from "../types";
import { ActionButton } from "@/components/ui/action-button";
import { useQuery } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import { getCompanies } from "@/features/companies/services/companiesService";

export type BusinessUnitFormValues = {
  name: string;
  ide?: string;
  description?: string;
  legalRepresentativeName?: string;
  address?: string;
  phone?: string;
  order?: number | null;
  companyId: string; // requerido
  isActive?: boolean; // solo visible en editar
};

type ModalMode = "crear" | "editar" | "ver";

type ModalBusinessUnitProps = {
  isOpen: boolean;
  modo: ModalMode;
  businessUnit: BusinessUnit | null;
  onClose: () => void;
  onSave: (result: {
    mode: Exclude<ModalMode, "ver">;
    id?: string;
    payload: BusinessUnitFormValues;
  }) => void;
};

const fmtTitle = (m: ModalMode) =>
  m === "crear"
    ? "Nueva Unidad de Negocio"
    : m === "editar"
    ? "Editar Unidad de Negocio"
    : "Detalle de Unidad de Negocio";

export function ModalBusinessUnit({
  isOpen,
  modo,
  businessUnit,
  onClose,
  onSave,
}: ModalBusinessUnitProps) {
  const readOnly = modo === "ver";

  // compañías para el selector
  const { data: companies = [] } = useQuery({
    queryKey: QKEY.companies,
    queryFn: getCompanies,
  });

  // Valores iniciales (si hay businessUnit)
  const defaults: BusinessUnitFormValues = {
    name: businessUnit?.name ?? "",
    ide: businessUnit?.ide ?? "",
    description: businessUnit?.description ?? "",
    legalRepresentativeName: businessUnit?.legalRepresentativeName ?? "",
    address: businessUnit?.address ?? "",
    phone: businessUnit?.phone ?? "",
    order:
      businessUnit?.order === undefined ||
      businessUnit?.order === null ||
      Number.isNaN(Number(businessUnit?.order))
        ? null
        : Number(businessUnit?.order),
    companyId: businessUnit?.companyId ?? "", // si estamos creando, se setea en efecto
    isActive: businessUnit?.isActive ?? true,
  };

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<BusinessUnitFormValues>({
    mode: "onTouched",
    defaultValues: defaults,
  });

  const { field: companyIdField, fieldState: companyIdState } = useController({
    name: "companyId",
    control,
    rules: { required: "Selecciona una compañía" },
  });

  // Reset cuando cambien props (igual patrón que modal de company)
  React.useEffect(() => {
    reset(defaults);
    // Si estamos creando y aún no hay companyId, setear primera compañía disponible
    if (modo === "crear" && !defaults.companyId && companies[0]?.id) {
      setValue("companyId", companies[0].id, { shouldValidate: true });
    }

    if (modo === "editar" && defaults.companyId) {
      companyIdField.onChange(defaults.companyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, businessUnit, modo, companies]);

  const submit = (values: BusinessUnitFormValues) => {
    if (modo === "ver") return;

    const payloadBase: BusinessUnitFormValues = {
      ...values,
      name: String(values.name || "").trim(),
      // normalizaciones (opcional -> undefined si vacío)
      ide: values.ide?.trim() || undefined,
      description: values.description?.trim() || undefined,
      legalRepresentativeName:
        values.legalRepresentativeName?.trim() || undefined,
      address: values.address?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      order:
        values.order === undefined ||
        values.order === null ||
        Number.isNaN(Number(values.order))
          ? null
          : Number(values.order),
      companyId: values.companyId, // requerido
    };

    if (modo === "crear") {
      // ⬇️ quitar isActive en create
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { isActive, ...createPayload } = payloadBase;
      onSave({ mode: "crear", payload: createPayload });
    } else {
      onSave({
        mode: "editar",
        id: businessUnit?.id,
        payload: payloadBase, // en editar puede incluir isActive
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{fmtTitle(modo)}</DialogTitle>
          <DialogDescription>
            {modo === "crear"
              ? "Completa los datos para registrar una nueva unidad."
              : modo === "editar"
              ? "Actualiza los datos de la unidad de negocio."
              : "Consulta la información de la unidad."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(submit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Name */}
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              placeholder="Nombre de la unidad"
              {...register("name", {
                required: "El nombre es obligatorio",
                minLength: { value: 3, message: "Mínimo 3 caracteres" },
                maxLength: { value: 150, message: "Máximo 150 caracteres" },
              })}
              disabled={readOnly || isSubmitting}
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* IDE (opcional, máx 13, solo dígitos si se llena) */}
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="ide">Identificación</Label>
            <Input
              id="ide"
              placeholder="RUC/CÉDULA"
              inputMode="numeric"
              {...register("ide", {
                validate: (v) =>
                  !v || /^\d{1,13}$/.test(v) || "Solo dígitos (máx. 13)",
              })}
              disabled={readOnly || isSubmitting}
            />
            {errors.ide && (
              <p className="text-xs text-red-600">{errors.ide as any}</p>
            )}
          </div>

          {/* Legal Rep */}
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="legalRepresentativeName">Representante legal</Label>
            <Input
              id="legalRepresentativeName"
              placeholder="Nombre del representante"
              {...register("legalRepresentativeName", {
                maxLength: { value: 250, message: "Máximo 250 caracteres" },
              })}
              disabled={readOnly || isSubmitting}
            />
            {errors.legalRepresentativeName && (
              <p className="text-xs text-red-600">
                {errors.legalRepresentativeName.message}
              </p>
            )}
          </div>

          {/* Phone (opcional, máx 50) */}
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              placeholder="0999999999"
              {...register("phone", {
                maxLength: { value: 50, message: "Máximo 50 caracteres" },
              })}
              disabled={readOnly || isSubmitting}
            />
            {errors.phone && (
              <p className="text-xs text-red-600">{errors.phone.message}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              placeholder="Calle / Av. / N°"
              {...register("address", {
                maxLength: { value: 250, message: "Máximo 250 caracteres" },
              })}
              disabled={readOnly || isSubmitting}
            />
            {errors.address && (
              <p className="text-xs text-red-600">{errors.address.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Breve descripción…"
              rows={3}
              {...register("description", {
                maxLength: { value: 500, message: "Máximo 500 caracteres" },
              })}
              disabled={readOnly || isSubmitting}
            />
            {errors.description && (
              <p className="text-xs text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Order (number) */}
          {/* <div className="space-y-2 md:col-span-1">
            <Label htmlFor="order">Orden</Label>
            <Input
              id="order"
              type="number"
              inputMode="numeric"
              placeholder="1"
              {...register("order", {
                setValueAs: (v) => (v === "" || v === null ? null : Number(v)),
              })}
              disabled={readOnly || isSubmitting}
            />
          </div> */}

          {/* Company (selector requerido) */}
          <div className="space-y-2 md:col-span-1">
            <Label>Compañía *</Label>
            <Select
              disabled={readOnly || isSubmitting}
              value={companyIdField.value ?? ""} // controlado por RHF
              onValueChange={(v) =>
                setValue("companyId", v, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full">
                {" "}
                <SelectValue placeholder="Selecciona una compañía" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {companyIdState.error && (
              <p className="text-xs text-red-600">
                {companyIdState.error.message}
              </p>
            )}
          </div>

          {/* Switches (solo en editar) */}
          <div className="md:col-span- grid grid-cols-1 gap-4">
            {modo !== "crear" && (
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive" className="mr-4">
                  Activa
                </Label>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch
                      id="isActive"
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                      disabled={readOnly || isSubmitting}
                    />
                  )}
                />
              </div>
            )}
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
