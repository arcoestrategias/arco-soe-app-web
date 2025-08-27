"use client";

import * as React from "react";
import { useMemo } from "react";
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
import { getCompanies } from "@/features/companies/services/companiesService";
import { getBusinessUnits } from "@/features/business-units/services/businessUnitsService";
import { getRoles } from "@/features/roles/services/rolesService";
import type { Role, User, UserBusinessUnitLink } from "../types/types";

export type UserFormValues = {
  email: string;
  firstName: string;
  lastName: string;
  username?: string | null;
  ide?: string | null;
  telephone?: string | null;
  password?: string; // solo crear

  // selects (crear/editar)
  roleId?: string;
  companyId?: string; // solo UI para filtrar BU
  businessUnitId?: string;

  // editar
  isActive?: boolean;
  isResponsible?: boolean;
  copyPermissions?: boolean;
  sendEmailConfirmation?: boolean;
};

type ModalMode = "crear" | "editar" | "ver";

type Props = {
  isOpen: boolean;
  modo: ModalMode;
  user: User | null; // User ahora trae userBusinessUnits e isEmailConfirmed
  onClose: () => void;
  onSave: (r: {
    mode: Exclude<ModalMode, "ver">;
    id?: string;
    payload: UserFormValues;
  }) => void;
};

const fmtTitle = (m: ModalMode) =>
  m === "crear"
    ? "Nuevo Usuario"
    : m === "editar"
    ? "Editar Usuario"
    : "Detalle de Usuario";

const normalizeStr = (v?: string | null) => {
  const s = (v ?? "").trim();
  return s.length ? s : undefined;
};

export function ModalUser({ isOpen, modo, user, onClose, onSave }: Props) {
  const readOnly = modo === "ver";

  // Catálogos
  const { data: companies = [] } = useQuery({
    queryKey: QKEY.companies,
    queryFn: getCompanies,
  });
  const { data: allBusinessUnits = [] } = useQuery({
    queryKey: QKEY.businessUnits,
    queryFn: getBusinessUnits,
  });
  const { data: roles = [] } = useQuery({
    queryKey: QKEY.roles,
    queryFn: getRoles,
  });

  // Elegimos el “link primario” para prefills (prioriza isResponsible; si no, el primero)
  const primaryLink: UserBusinessUnitLink | undefined = useMemo(() => {
    const arr = user?.userBusinessUnits ?? [];
    if (!arr || arr.length === 0) return undefined;
    return arr.find((l) => l.isResponsible) ?? arr[0];
  }, [user?.userBusinessUnits]);

  // Derivar companyId desde la BU del link
  const linkCompanyId: string | undefined = useMemo(() => {
    if (!primaryLink?.businessUnitId) return undefined;
    const bu = (allBusinessUnits as any[]).find(
      (b) => b.id === primaryLink.businessUnitId
    );
    return bu?.companyId;
  }, [primaryLink?.businessUnitId, allBusinessUnits]);

  // Defaults (usar link al editar; si no hay, quedarán vacíos y luego preseleccionamos primeros)
  const defaults: UserFormValues = {
    email: user?.email ?? "",
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    username: user?.username ?? "",
    ide: user?.ide ?? "",
    telephone: user?.telephone ?? "",
    isActive: user?.isActive ?? true,

    roleId: primaryLink?.roleId ?? undefined,
    companyId: linkCompanyId ?? undefined,
    businessUnitId: primaryLink?.businessUnitId ?? undefined,

    password: "",

    isResponsible: primaryLink?.isResponsible ?? false,
    copyPermissions: true,
    sendEmailConfirmation: false,
  };

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<UserFormValues>({ mode: "onTouched", defaultValues: defaults });

  // RHF controllers para Select
  const { field: companyField } = useController({
    name: "companyId",
    control,
    rules: modo !== "ver" ? { required: "Selecciona una compañía" } : undefined,
  });
  const { field: buField } = useController({
    name: "businessUnitId",
    control,
    rules:
      modo !== "ver"
        ? { required: "Selecciona una unidad de negocio" }
        : undefined,
  });
  const { field: roleField } = useController({
    name: "roleId",
    control,
    rules: modo !== "ver" ? { required: "Selecciona un rol" } : undefined,
  });

  // BUs filtradas por la compañía elegida
  const filteredBUs = useMemo(() => {
    if (!companyField.value)
      return [] as { id: string; name: string; companyId: string }[];
    return (allBusinessUnits ?? []).filter(
      (b: any) => b.companyId === companyField.value
    );
  }, [allBusinessUnits, companyField.value]);

  // Reset al abrir/cambiar user o modo
  React.useEffect(() => {
    reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen,
    modo,
    user?.id,
    primaryLink?.businessUnitId,
    primaryLink?.roleId,
    linkCompanyId,
  ]);

  // Cuando llegan catálogos, si aún no hay valores, preselecciona basados en link o primeros
  React.useEffect(() => {
    if (!isOpen || readOnly) return;

    // company
    if (!companyField.value) {
      const cid = linkCompanyId ?? (companies[0]?.id as string | undefined);
      if (cid)
        setValue("companyId", cid, {
          shouldDirty: false,
          shouldValidate: true,
        });
    }

    // business unit
    if (!buField.value) {
      const targetCid = companyField.value ?? linkCompanyId;
      if (targetCid) {
        const firstBU = (allBusinessUnits ?? []).find(
          (b: any) => b.companyId === targetCid
        )?.id;
        if (firstBU)
          setValue("businessUnitId", firstBU, {
            shouldDirty: false,
            shouldValidate: true,
          });
      }
    }

    // role
    if (!roleField.value) {
      const rid = primaryLink?.roleId ?? (roles[0]?.id as string | undefined);
      if (rid)
        setValue("roleId", rid, { shouldDirty: false, shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen,
    companies,
    allBusinessUnits,
    roles,
    linkCompanyId,
    primaryLink?.roleId,
  ]);

  const submit = (values: UserFormValues) => {
    if (modo === "ver") return;

    const payload: UserFormValues = {
      email: String(values.email || "").trim(),
      firstName: String(values.firstName || "").trim(),
      lastName: String(values.lastName || "").trim(),
      username: normalizeStr(values.username),
      ide: normalizeStr(values.ide),
      telephone: normalizeStr(values.telephone),
      isActive: values.isActive,

      roleId: values.roleId,
      companyId: values.companyId,
      businessUnitId: values.businessUnitId,

      password:
        modo === "crear" ? String(values.password || "").trim() : undefined,

      isResponsible: values.isResponsible,
      copyPermissions: values.copyPermissions,
      sendEmailConfirmation: values.sendEmailConfirmation,
    };

    if (modo === "crear") onSave({ mode: "crear", payload });
    else onSave({ mode: "editar", id: user?.id, payload });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{fmtTitle(modo)}</DialogTitle>
          <DialogDescription>
            {modo === "crear"
              ? "Completa los datos para registrar un nuevo usuario."
              : modo === "editar"
              ? "Actualiza los datos del usuario."
              : "Consulta la información del usuario."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(submit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Nombres / Apellidos */}
          <div className="space-y-2">
            <Label htmlFor="firstName">Nombres *</Label>
            <Input
              id="firstName"
              maxLength={100}
              disabled={readOnly || isSubmitting}
              {...register("firstName", { required: "Requerido" })}
            />
            {errors.firstName && (
              <p className="text-xs text-red-600">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Apellidos *</Label>
            <Input
              id="lastName"
              maxLength={100}
              disabled={readOnly || isSubmitting}
              {...register("lastName", { required: "Requerido" })}
            />
            {errors.lastName && (
              <p className="text-xs text-red-600">{errors.lastName.message}</p>
            )}
          </div>

          {/* Email / Username */}
          <div className="space-y-2">
            <Label htmlFor="email">Correo *</Label>
            <Input
              id="email"
              type="email"
              maxLength={150}
              disabled={readOnly || isSubmitting}
              {...register("email", { required: "Requerido" })}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              maxLength={100}
              disabled={readOnly || isSubmitting}
              {...register("username")}
            />
          </div>

          {/* IDE / Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="ide">Identificación</Label>
            <Input
              id="ide"
              maxLength={13}
              inputMode="numeric"
              disabled={readOnly || isSubmitting}
              {...register("ide")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telephone">Teléfono</Label>
            <Input
              id="telephone"
              maxLength={50}
              disabled={readOnly || isSubmitting}
              {...register("telephone")}
            />
          </div>

          {/* Password (solo crear) */}
          {modo === "crear" && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mín 6, máx 50, con mayúsculas, minúsculas y número"
                disabled={isSubmitting}
                {...register("password", {
                  required: "Requerido",
                  minLength: { value: 6, message: "Mínimo 6 caracteres" },
                  maxLength: { value: 50, message: "Máximo 50 caracteres" },
                  validate: (v) =>
                    /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*/.test(
                      v || ""
                    ) || "Debe contener mayúsculas, minúsculas y número",
                })}
              />
              {errors.password && (
                <p className="text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
          )}

          {/* Selects (crear/editar) */}
          {modo !== "ver" && (
            <>
              <div className="space-y-2">
                <Label>Rol *</Label>
                <Select
                  value={roleField.value ?? ""}
                  onValueChange={(v) =>
                    setValue("roleId", v, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r: Role) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.roleId && (
                  <p className="text-xs text-red-600">
                    {errors.roleId.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Compañía *</Label>
                <Select
                  value={companyField.value ?? ""}
                  onValueChange={(v) => {
                    setValue("companyId", v, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    const nextFirst = (allBusinessUnits ?? []).find(
                      (b: any) => b.companyId === v
                    )?.id;
                    setValue("businessUnitId", nextFirst ?? "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una compañía" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.companyId && (
                  <p className="text-xs text-red-600">
                    {errors.companyId.message as string}
                  </p>
                )}
              </div>

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
                  disabled={isSubmitting || !companyField.value}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        companyField.value
                          ? "Selecciona una unidad"
                          : "Selecciona primero la compañía"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
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
            </>
          )}

          {/* Switch activo + checks adicionales (solo editar) */}
          {modo === "editar" && (
            <>
              <div className="md:col-span-2 flex items-center justify-between">
                <Label htmlFor="isActive" className="mr-4">
                  Activo
                </Label>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch
                      id="isActive"
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between border rounded-md p-3">
                  <div className="space-y-1">
                    <Label htmlFor="isResponsible">
                      Responsable de la unidad
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Marca si el usuario será responsable de esta unidad.
                    </p>
                  </div>
                  <Controller
                    control={control}
                    name="isResponsible"
                    render={({ field }) => (
                      <Switch
                        id="isResponsible"
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    )}
                  />
                </div>

                <div className="flex items-center justify-between border rounded-md p-3">
                  <div className="space-y-1">
                    <Label htmlFor="copyPermissions">
                      Copiar permisos del rol
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Aplica permisos del rol a la asignación.
                    </p>
                  </div>
                  <Controller
                    control={control}
                    name="copyPermissions"
                    render={({ field }) => (
                      <Switch
                        id="copyPermissions"
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    )}
                  />
                </div>

                {!user?.isEmailConfirmed && (
                  <div className="flex items-center justify-between border rounded-md p-3 md:col-span-2">
                    <div className="space-y-1">
                      <Label htmlFor="sendEmailConfirmation">
                        Enviar confirmación de email
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Envía un correo de confirmación a {user?.email}.
                      </p>
                    </div>
                    <Controller
                      control={control}
                      name="sendEmailConfirmation"
                      render={({ field }) => (
                        <Switch
                          id="sendEmailConfirmation"
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      )}
                    />
                  </div>
                )}
              </div>
            </>
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
