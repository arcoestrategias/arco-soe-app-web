"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
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

import type { Company } from "../types";
import { ActionButton } from "@/components/ui/action-button";

export type CompanyFormValues = {
  name: string;
  ide: string;
  description?: string;
  legalRepresentativeName?: string;
  address?: string;
  phone?: string;
  order?: number | null;
  isPrivate?: boolean;
  isGroup?: boolean;
  isActive?: boolean;
};

type ModalMode = "crear" | "editar" | "ver";

type ModalCompanyProps = {
  isOpen: boolean;
  modo: ModalMode;
  company: Company | null;
  onClose: () => void;
  onSave: (result: {
    mode: Exclude<ModalMode, "ver">;
    id?: string;
    payload: CompanyFormValues;
  }) => void;
};

const fmtTitle = (m: ModalMode) =>
  m === "crear"
    ? "Nueva Compañía"
    : m === "editar"
    ? "Editar Compañía"
    : "Detalle de Compañía";

export function ModalCompany({
  isOpen,
  modo,
  company,
  onClose,
  onSave,
}: ModalCompanyProps) {
  const readOnly = modo === "ver";

  // Valores iniciales (si hay company)
  const defaults: CompanyFormValues = {
    name: company?.name ?? "",
    ide: company?.ide ?? "",
    description: company?.description ?? "",
    legalRepresentativeName: company?.legalRepresentativeName ?? "",
    address: company?.address ?? "",
    phone: company?.phone ?? "",
    order: company?.order ?? null,
    isPrivate: company?.isPrivate ?? false,
    isGroup: company?.isGroup ?? false,
    isActive: company?.isActive ?? true,
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CompanyFormValues>({
    mode: "onTouched",
    defaultValues: defaults,
  });

  // Reset cuando cambie la compañía o el modo
  React.useEffect(() => {
    reset(defaults);
  }, [isOpen, company, modo]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (values: CompanyFormValues) => {
    if (modo === "ver") return;

    const payloadBase = {
      ...values,
      order:
        values.order === undefined ||
        values.order === null ||
        Number.isNaN(Number(values.order))
          ? null
          : Number(values.order),
      description: values.description?.trim() || undefined,
      legalRepresentativeName:
        values.legalRepresentativeName?.trim() || undefined,
      address: values.address?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
    };

    if (modo === "crear") {
      // ⬇️ quitar isActive para crear
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { isActive, ...createPayload } = payloadBase;
      onSave({ mode: "crear", payload: createPayload }); // CreateCompanyPayload
    } else {
      onSave({
        mode: "editar",
        id: company?.id,
        payload: payloadBase, // UpdateCompanyPayload (aquí sí puede ir isActive)
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
              ? "Completa los datos para registrar una nueva compañía."
              : modo === "editar"
              ? "Actualiza los datos de la compañía."
              : "Consulta la información de la compañía."}
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
              placeholder="Razón social"
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

          {/* IDE */}
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="ide">Identificación *</Label>
            <Input
              id="ide"
              placeholder="RUC/CÉDULA"
              inputMode="numeric"
              {...register("ide", {
                required: "La identificación es obligatoria",
                pattern: {
                  value: /^\d{10,13}$/,
                  message: "Debe tener entre 10 y 13 dígitos",
                },
              })}
              disabled={readOnly || isSubmitting}
            />
            {errors.ide && (
              <p className="text-xs text-red-600">{errors.ide.message}</p>
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

          {/* Legal Rep */}
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="legalRepresentativeName">Representante legal</Label>
            <Input
              id="legalRepresentativeName"
              placeholder="Nombre del representante"
              {...register("legalRepresentativeName")}
              disabled={readOnly || isSubmitting}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              placeholder="0999999999"
              inputMode="numeric"
              {...register("phone", {
                pattern: {
                  value: /^\d{7,15}$/,
                  message: "Solo dígitos (7 a 15)",
                },
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
              {...register("address")}
              disabled={readOnly || isSubmitting}
            />
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

          {/* Switches */}
          <div className="md:col-span-1 grid grid-cols-1 gap-4">
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
