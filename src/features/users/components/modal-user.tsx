"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { authService } from "@/features/auth/services/authService";
import { useForm, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { QKEY } from "@/shared/api/query-keys";
import { getHumanErrorMessage } from "@/shared/api/response";

import { getRoles } from "@/features/roles/services/rolesService";
import { getBusinessUnits } from "@/features/business-units/services/businessUnitsService";
import { getCompanyId } from "@/shared/auth/storage";

import { InputWithCounter } from "@/shared/components/input-with-counter";

import type { User } from "@/features/users/types/types";
import { DialogDescription } from "@radix-ui/react-dialog";

export type ModalUserData = User & {
  roleId?: string | null;
  roleName?: string | null;
  positionId?: string | null;
  positionName?: string | null;
  userBusinessUnits?: Array<{
    businessUnitId: string;
    isResponsible?: boolean;
  }>;
  isEmailConfirmed?: boolean;
  lastLoginAt?: string | null;
};

type Modo = "crear" | "editar" | "ver";

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  ide?: string;
  telephone?: string;

  isEmailConfirmed?: boolean;

  businessUnitId?: string;
  roleId?: string;

  password?: string; // solo crear
  addToAnotherBU?: boolean;
};

type Props = {
  isOpen: boolean;
  modo: Modo;
  user: ModalUserData | null;
  onClose: () => void;
  onSave: (args: {
    mode: "crear" | "editar";
    id?: string;
    payload: any;
  }) => void;
  businessUnitId?: string;
};

const fmtDate = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function pickPrimaryLink(u?: ModalUserData | null) {
  const links = u?.userBusinessUnits ?? [];
  if (!links || !links.length) return undefined;
  return links.find((l) => l.isResponsible) ?? links[0];
}

function generateSecurePassword(): string {
  const min = 12,
    max = 20;
  const length = Math.floor(Math.random() * (max - min + 1)) + min;
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const pool = upper + lower + digits;
  let pass = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
  ];
  for (let i = pass.length; i < length; i++)
    pass.push(pool[Math.floor(Math.random() * pool.length)]);
  for (let i = pass.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pass[i], pass[j]] = [pass[j], pass[i]];
  }
  return pass.join("");
}

export function ModalUser(props: Props) {
  const { isOpen, modo, user, onClose, onSave, businessUnitId } = props;

  // Catálogos
  const rolesQuery = useQuery({ queryKey: QKEY.roles, queryFn: getRoles });
  const businessUnitsQuery = useQuery({
    queryKey: QKEY.businessUnits,
    queryFn: getBusinessUnits,
  });

  // IDs del storage
  const storageCompanyId = getCompanyId() ?? "";
  // const storageBUId = getBusinessUnitId() ?? "";

  // Primary link del usuario para prefills en editar/ver
  const primaryLink = useMemo(() => pickPrimaryLink(user), [user]);

  // Filtrado de BUs POR COMPANY del storage (no todas)
  const filteredBUs = useMemo(() => {
    const all = businessUnitsQuery.data ?? [];
    return storageCompanyId
      ? all.filter((b: any) => b.companyId === storageCompanyId)
      : all;
  }, [businessUnitsQuery.data, storageCompanyId]);

  // Role “Cliente” por defecto en crear (si existe)
  const defaultClientRoleId = useMemo(() => {
    const rs = rolesQuery.data ?? [];
    const byName = rs.find((r: any) =>
      ["Cliente", "Client"].includes((r.name || "").trim())
    );
    return byName?.id ?? rs[0]?.id ?? undefined;
  }, [rolesQuery.data]);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    defaultValues: {} as any, // los seteamos con reset()
  });

  // Centraliza los initial values según modo + datos disponibles
  const initialValues = useMemo<FormValues>(() => {
    const values: FormValues = {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      ide: user?.ide ?? "",
      telephone: user?.telephone ?? "",
      isEmailConfirmed: !!user?.isEmailConfirmed,
      roleId:
        modo === "crear"
          ? defaultClientRoleId ?? undefined
          : user?.roleId ?? undefined,
      businessUnitId:
        modo === "crear"
          ? businessUnitId || undefined
          : businessUnitId || primaryLink?.businessUnitId || undefined,
      password: modo === "crear" ? "" : undefined,
      addToAnotherBU: false,
    };
    return values;
  }, [user, modo, defaultClientRoleId, businessUnitId, primaryLink]);

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  // Prefill cuando llegan catálogos (por si defaultValues no alcanzan)
  useEffect(() => {
    if (modo === "crear") {
      // BU por storage si existe y está en el filtrado
      if (!watch("businessUnitId")) {
        const exists = filteredBUs.some((b: any) => b.id === businessUnitId);
        if (exists) setValue("businessUnitId", businessUnitId);
      }
      // Rol Cliente por defecto (o primero disponible)
      if (!watch("roleId") && defaultClientRoleId)
        setValue("roleId", defaultClientRoleId);
    } else if (modo === "editar" || modo === "ver") {
      if (!watch("roleId") && user?.roleId) setValue("roleId", user.roleId);
      const wantedBU = businessUnitId || primaryLink?.businessUnitId;
      if (!watch("businessUnitId") && wantedBU) {
        const exists = filteredBUs.some((b: any) => b.id === wantedBU);
        if (exists) setValue("businessUnitId", wantedBU);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, filteredBUs, rolesQuery.data, user, businessUnitId, primaryLink]);

  const disabled = modo === "ver";

  // Validaciones
  const req = (msg: string) => ({ required: msg });
  const onlyDigits = (v?: string) => !v || /^[0-9]*$/.test(v) || "Solo números";
  const emailPattern = {
    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Correo inválido",
  };

  const onSubmit = (values: FormValues) => {
    try {
      const clean = {
        // Obligatorios
        firstName: values.firstName?.trim(),
        lastName: values.lastName?.trim(),
        email: values.email?.trim(),
        ide: values.ide?.trim(),

        // Opcional
        telephone: values.telephone?.trim() || undefined,

        // Configuración
        roleId: values.roleId,
        businessUnitId: values.businessUnitId,

        // Crear
        password: values.password?.trim() || undefined,
        addToAnotherBU: !!values.addToAnotherBU,
      };

      if (modo === "crear") {
        onSave({ mode: "crear", payload: clean });
      } else if (modo === "editar") {
        onSave({ mode: "editar", id: user?.id, payload: clean });
      }
    } catch (e: any) {
      toast.error(getHumanErrorMessage(e));
    }
  };

  const [sendingConfirm, setSendingConfirm] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const handleGeneratePassword = () => {
    const pwd = generateSecurePassword();
    setValue("password", pwd, { shouldValidate: true });
    toast.success("Contraseña generada");
  };

  const handleCopyPassword = async () => {
    const pwd = watch("password") || "";
    if (!pwd) return toast.error("No hay contraseña para copiar");
    try {
      await navigator.clipboard.writeText(pwd);
      toast.success("Contraseña copiada");
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const handleResetPassword = async () => {
    const email = user?.email ?? watch("email") ?? "";
    if (!email) return toast.error("No hay correo para enviar instrucciones");
    const tid = toast.loading(
      "Enviando correo de Restablecimiento de Contraseña"
    );
    try {
      setSendingReset(true);
      await authService.forgotPassword(email);
      toast.success(
        "Si el correo existe, enviaremos las instrucciones de reestablecimiento",
        {
          id: tid,
        }
      );
    } catch (e: any) {
      toast.error(getHumanErrorMessage(e), { id: tid });
    } finally {
      setSendingReset(false);
    }
  };

  const handleSendEmailConfirmation = async () => {
    const tid = toast.loading("Enviando correo de confirmacion de cuenta");
    try {
      setSendingConfirm(true);
      await authService.sendEmailConfirmation(user!.id);
      toast.success(
        "Si el correo existe, recibiras las instrucciones para confirmar la cuenta",
        {
          id: tid,
        }
      );
    } catch (e: any) {
      toast.error(getHumanErrorMessage(e), { id: tid });
    } finally {
      setSendingConfirm(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {modo === "crear"
              ? "Nuevo usuario"
              : modo === "editar"
              ? "Editar usuario"
              : "Detalle de usuario"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Formulario de gestión de usuario
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* ========== Sección 1: Información del usuario ========== */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold">Información del usuario</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="firstName"
                  control={control}
                  rules={req("Nombre es obligatorio")}
                  render={({ field }) => (
                    <>
                      <InputWithCounter
                        value={field.value || ""}
                        onChange={field.onChange}
                        maxLength={100}
                        placeholder="Nombre"
                        disabled={modo === "ver"}
                        className={errors.firstName ? "border-red-500" : ""}
                      />
                      {errors.firstName && (
                        <p className="text-xs text-red-500 mt-1">
                          {String(errors.firstName.message)}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Apellido <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="lastName"
                  control={control}
                  rules={req("Apellido es obligatorio")}
                  render={({ field }) => (
                    <>
                      <InputWithCounter
                        value={field.value || ""}
                        onChange={field.onChange}
                        maxLength={100}
                        placeholder="Apellido"
                        disabled={modo === "ver"}
                        className={errors.lastName ? "border-red-500" : ""}
                      />
                      {errors.lastName && (
                        <p className="text-xs text-red-500 mt-1">
                          {String(errors.lastName.message)}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-1">
                  Correo <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="correo@empresa.com"
                  disabled={modo === "ver"}
                  {...register("email", {
                    ...req("Correo es obligatorio"),
                    pattern: emailPattern,
                  })}
                  className={`w-full ${errors.email ? "border-red-500" : ""}`}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">
                    {String(errors.email.message)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Identificación <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="ide"
                  control={control}
                  rules={{
                    ...req("Identificación es obligatoria"),
                    validate: (v) =>
                      (!!v && v.length <= 13 && /^[0-9]+$/.test(v)) ||
                      "Hasta 13 dígitos numéricos",
                  }}
                  render={({ field }) => (
                    <>
                      <InputWithCounter
                        value={field.value || ""}
                        onChange={(val) => {
                          if (/^[0-9]*$/.test(val) && val.length <= 13)
                            field.onChange(val);
                        }}
                        maxLength={13}
                        disabled={modo === "ver"}
                        placeholder="Identificación (máx. 13 dígitos)"
                        className={errors.ide ? "border-red-500" : ""}
                      />
                      {errors.ide && (
                        <p className="text-xs text-red-500 mt-1">
                          {String(errors.ide.message)}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Controller
                  name="telephone"
                  control={control}
                  rules={{ validate: onlyDigits }}
                  render={({ field }) => (
                    <>
                      <InputWithCounter
                        value={field.value || ""}
                        onChange={(val) => {
                          if (/^[0-9]*$/.test(val) && val.length <= 13)
                            field.onChange(val);
                        }}
                        maxLength={13}
                        disabled={modo === "ver"}
                        placeholder="Teléfono (opcional, máx. 13 dígitos)"
                        className={errors.telephone ? "border-red-500" : ""}
                      />
                      {errors.telephone && (
                        <p className="text-xs text-red-500 mt-1">
                          {String(errors.telephone.message)}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>
            </div>
          </section>

          {/* ========== Sección 2: Confirmación de correo (no se muestra en CREAR) ========== */}
          {modo !== "crear" && (
            <>
              <Separator />
              <section className="space-y-4">
                <h3 className="text-sm font-semibold">
                  Confirmación de correo
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        watch("isEmailConfirmed")
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                      }
                    >
                      {watch("isEmailConfirmed")
                        ? "Confirmado"
                        : "No confirmado"}
                    </Badge>
                    {user?.lastLoginAt ? (
                      <span className="text-xs text-muted-foreground">
                        Último acceso:{" "}
                        {fmtDate.format(new Date(user.lastLoginAt))}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Último acceso: —
                      </span>
                    )}
                  </div>

                  <div className="flex md:justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-w-[220px] h-9 text-sm"
                      onClick={handleResetPassword}
                      disabled={disabled || sendingReset}
                    >
                      {sendingReset ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando…
                        </span>
                      ) : (
                        "Reestablecer contraseña"
                      )}
                    </Button>
                  </div>

                  <div className="flex md:justify-end">
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 btn-gradient"
                      onClick={handleSendEmailConfirmation}
                      disabled={modo === "ver" || sendingConfirm}
                    >
                      {sendingConfirm ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando…
                        </span>
                      ) : (
                        "Enviar mail de confirmación"
                      )}
                    </Button>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ========== Sección 3: Configuración en unidad de negocio ========== */}
          <Separator />
          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Configuración en unidad de negocio
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Rol */}
              <div className="space-y-2">
                <Label>Rol</Label>
                <Controller
                  control={control}
                  name="roleId"
                  rules={{
                    required: modo !== "ver" ? "Rol es obligatorio" : false,
                  }}
                  render={({ field }) => (
                    <>
                      <Select
                        disabled={modo === "ver"}
                        value={field.value ?? ""}
                        onValueChange={(val) =>
                          field.onChange(val || undefined)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {(rolesQuery.data ?? []).map((r: any) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.roleId && (
                        <p className="text-xs text-red-500 mt-1">
                          {String(errors.roleId.message)}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>

              {/* Unidad de negocio (filtrada por companyId en storage) */}
              <div className="space-y-2">
                <Label>Unidad de negocio</Label>
                <Controller
                  control={control}
                  name="businessUnitId"
                  rules={{
                    required:
                      modo !== "ver"
                        ? "Unidad de negocio es obligatoria"
                        : false,
                  }}
                  render={({ field }) => (
                    <>
                      <Select
                        disabled={disabled || filteredBUs.length === 0}
                        value={field.value ?? ""}
                        onValueChange={(val) =>
                          field.onChange(val || undefined)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              filteredBUs.length
                                ? "Selecciona una unidad de negocio"
                                : "No hay unidades disponibles para la compañía"
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
                        <p className="text-xs text-red-500 mt-1">
                          {String(errors.businessUnitId.message)}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>
            </div>

            {modo === "editar" && (
              <div className="flex items-center gap-3">
                <Switch
                  checked={!!watch("addToAnotherBU")}
                  onCheckedChange={(v) => setValue("addToAnotherBU", v)}
                  disabled={false}
                />
                <span className="text-sm">
                  Agregar a otra unidad (no mover)
                </span>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              <strong>Importante:</strong> si cambias el <em>rol</em>, el
              sistema reemplaza los permisos de esa unidad por los del rol. Si
              cambias la <em>unidad de negocio</em>:
              <br />• con <em>“Agregar a otra unidad”</em> activado → el usuario
              quedará en ambas BUs (no se mueve).
              <br />• con el switch apagado → se moverá a la nueva BU.
            </p>
          </section>

          {/* Crear: sección de password (sin sección de correo) */}
          {modo === "crear" && (
            <>
              <Separator />
              <section className="space-y-4">
                <h3 className="text-sm font-semibold">Contraseña</h3>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
                  <div>
                    <Input
                      type="text"
                      placeholder="Genera o ingresa una contraseña segura"
                      {...register("password", {
                        required: "La contraseña es obligatoria",
                        validate: (v) =>
                          (!!v &&
                            v.length >= 6 &&
                            v.length <= 50 &&
                            /[A-Z]/.test(v) &&
                            /[a-z]/.test(v) &&
                            /[0-9]/.test(v)) ||
                          "6–50, con mayúscula, minúscula y número",
                      })}
                      className={errors.password ? "border-red-500" : ""}
                    />
                    {errors.password && (
                      <p className="text-xs text-red-500 mt-1">
                        {String(errors.password.message)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGeneratePassword}
                    >
                      Generar
                    </Button>
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopyPassword}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
              </section>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            {modo !== "ver" && (
              <Button
                type="submit"
                size="sm"
                className="h-9 btn-gradient"
                disabled={isSubmitting}
              >
                {modo === "crear" ? "Crear" : "Guardar cambios"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
