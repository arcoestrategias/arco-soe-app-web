// src/features/auth/components/login-form.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getHumanErrorMessage } from "@/shared/api/response";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// icons
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

// storage helpers
import {
  clearBusinessUnit,
  clearSelectedCompanyId,
  getAccessToken,
  setBusinessUnitId,
  setPositionId,
  getBusinessUnitId,
  getCompanyId,
  setCompanyId,
} from "@/shared/auth/storage";

type Phase = "login" | "select-bu" | "select-admin";

type Props = {
  defaultRedirectTo?: string;
};

export default function LoginForm({ defaultRedirectTo = "/" }: Props) {
  const router = useRouter();
  const search = useSearchParams();

  const {
    login,
    reloadMe,
    selectBusinessUnit,
    me,
    businessUnits,
    needsSelection,
    loading,
    initializing,
  } = useAuth();

  // ---- estado común ----
  const [phase, setPhase] = React.useState<Phase>("login");
  const [form, setForm] = React.useState({ email: "", password: "" });
  const [errors, setErrors] = React.useState<{
    email?: string;
    password?: string;
    root?: string;
  }>({});
  const [pendingBU, setPendingBU] = React.useState(false);
  const [showPwd, setShowPwd] = React.useState(false);

  const redirectTo = React.useMemo(() => {
    const q = search?.get("redirect");
    return q && q.startsWith("/") ? q : defaultRedirectTo;
  }, [search, defaultRedirectTo]);

  const didRedirectRef = React.useRef(false);
  const didAutoSelectRef = React.useRef(false);

  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // ---- NO admin (selector BU) ----
  const buCount = businessUnits?.length ?? 0;
  const showSelector = phase === "select-bu" && needsSelection && buCount > 1;
  const [buId, setBuId] = React.useState<string>("");

  // ---- ADMIN (selector compañía + BU por compañía) ----
  const isAdmin = !!me?.isPlatformAdmin;
  const adminCompanies = React.useMemo(() => me?.companies ?? [], [me]);
  const companiesCount = adminCompanies?.length ?? 0;

  const [adminCompanyId, setAdminCompanyId] = React.useState<string>(
    getCompanyId() || ""
  );
  const adminSelectedCompany = React.useMemo(
    () => adminCompanies?.find((c) => c.id === adminCompanyId) || null,
    [adminCompanies, adminCompanyId]
  );
  const adminCompanyBUs = adminSelectedCompany?.businessUnits ?? [];
  const [adminBuId, setAdminBuId] = React.useState<string>("");
  const adminBusCount = adminCompanyBUs.length;

  const showAdminSelector =
    phase === "select-admin" && isAdmin && companiesCount > 0;

  // ---- Persistir positionId según /me (NO admin) o null (admin) ----
  React.useEffect(() => {
    if (!getAccessToken()) return;
    if (isAdmin) {
      setPositionId(null);
      return;
    }
    const pos = me?.currentBusinessUnit?.positionId ?? null;
    setPositionId(pos);
  }, [isAdmin, me?.currentBusinessUnit?.positionId]);

  // ---- Sincroniza selección admin con storage/lista actual ----
  React.useEffect(() => {
    if (
      companiesCount > 0 &&
      adminCompanyId &&
      !adminCompanies?.some((c) => c.id === adminCompanyId)
    ) {
      setAdminCompanyId("");
      clearSelectedCompanyId();
    }
  }, [companiesCount, adminCompanies, adminCompanyId]);

  // ---- Decidir fase y acciones (admin / no-admin) ----
  React.useEffect(() => {
    if (initializing) return;

    const token = getAccessToken();

    // A) Con token y NO necesita BU (NO admin)
    if (token && !needsSelection) {
      // Excepción: admin sin contexto aún
      if (isAdmin && companiesCount > 0) {
        const hasCompany = !!getCompanyId();
        const hasBU = !!getBusinessUnitId();
        if (!(hasCompany && hasBU)) {
          setPhase("select-admin");
          const firstCompanyId = adminCompanies?.[0]?.id ?? "";
          const firstBuId = adminCompanies?.[0]?.businessUnits?.[0]?.id ?? "";
          if (!adminCompanyId && firstCompanyId)
            setAdminCompanyId(firstCompanyId);
          if (!adminBuId && firstBuId) setAdminBuId(firstBuId);
          return;
        }
      }

      // Caso normal: redirige
      if (!didRedirectRef.current) {
        didRedirectRef.current = true;
        const go = redirectTo && redirectTo !== "/login" ? redirectTo : "/";
        router.replace(go);
      }
      return;
    }

    // B) Con token y SÍ necesita BU (NO admin)
    if (token && needsSelection) {
      if (!businessUnits || buCount === 0) {
        setErrors((e) => ({
          ...e,
          root: "No se encontraron unidades de negocio para tu usuario. Contacta al administrador.",
        }));
        return;
      }

      if (buCount === 1 && !didAutoSelectRef.current) {
        didAutoSelectRef.current = true;
        const only = businessUnits[0];
        (async () => {
          try {
            setBusinessUnitId(only.id);
            setPositionId(only?.positionId ?? null);
            await reloadMe();
            const go = redirectTo && redirectTo !== "/login" ? redirectTo : "/";
            router.replace(go);
          } catch (err) {
            toast.error(getHumanErrorMessage(err));
          }
        })();
        return;
      }

      if (buCount > 1) {
        setPhase("select-bu");
        if (!buId) setBuId(businessUnits[0].id);
      }
      return;
    }

    // C) Sin token → login
    setPhase("login");
  }, [
    initializing,
    needsSelection,
    businessUnits,
    buCount,
    isAdmin,
    companiesCount,
    adminCompanies,
    adminCompanyId,
    adminBuId,
    reloadMe,
    router,
    redirectTo,
    buId,
  ]);

  // ---- Limpieza al volver a login sin token ----
  React.useEffect(() => {
    if (phase === "login" && !getAccessToken()) {
      clearBusinessUnit();
      clearSelectedCompanyId();
      setPositionId(null);
    }
  }, [phase]);

  // ---- Submit único ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // ADMIN: Selección de compañía + BU
    if (showAdminSelector) {
      if (!adminCompanyId) {
        setErrors((p) => ({ ...p, root: "Selecciona una compañía." }));
        return;
      }
      if (!adminBuId) {
        setErrors((p) => ({ ...p, root: "Selecciona una unidad de negocio." }));
        return;
      }
      try {
        setCompanyId(adminCompanyId);
        setBusinessUnitId(adminBuId);
        setPositionId(null);
        await reloadMe();
        toast.success("Contexto de compañía aplicado.");
        const go = redirectTo && redirectTo !== "/login" ? redirectTo : "/";
        router.replace(go);
      } catch (err) {
        const msg = getHumanErrorMessage(err);
        setErrors((p) => ({ ...p, root: msg }));
        toast.error(msg);
      }
      return;
    }

    // NO admin: Selector BU (>1)
    if (showSelector) {
      if (!buId) {
        setErrors((p) => ({
          ...p,
          root: "Selecciona una unidad de negocio para continuar.",
        }));
        return;
      }
      try {
        setPendingBU(true);
        await selectBusinessUnit(buId);
        const sel = businessUnits?.find((b) => b.id === buId);
        setPositionId(sel?.positionId ?? null);
        await reloadMe();
        toast.success("Unidad de negocio seleccionada");
        const go = redirectTo && redirectTo !== "/login" ? redirectTo : "/";
        router.replace(go);
      } catch (err) {
        const msg = getHumanErrorMessage(err);
        setErrors((p) => ({ ...p, root: msg }));
        toast.error(msg);
      } finally {
        setPendingBU(false);
      }
      return;
    }

    // LOGIN
    const email = form.email.trim();
    const password = form.password;

    if (!email) return setErrors((p) => ({ ...p, email: "Ingresa tu correo" }));
    if (!isEmail(email))
      return setErrors((p) => ({ ...p, email: "Correo inválido" }));
    if (!password || password.length < 6)
      return setErrors((p) => ({ ...p, password: "Mínimo 6 caracteres" }));

    try {
      await login({ email, password });
      await reloadMe();
      toast.success("Inicio de sesión exitoso");
    } catch (err) {
      const msg = getHumanErrorMessage(err);
      setErrors((p) => ({ ...p, root: msg }));
      toast.error(msg);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const busy = loading || initializing;

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Iniciar sesión en SOE</CardTitle>
        <CardDescription>Accede a tu cuenta para continuar</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Bloque dinámico con altura uniforme entre fases */}
          <div className="min-h-[340px] transition-[min-height] duration-200 ease-out">
            {showAdminSelector ? (
              <div className="grid grid-cols-1 gap-4">
                {/* ADMIN: Compañía */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Compañía</Label>
                  <Select
                    value={adminCompanyId}
                    onValueChange={(v) => {
                      setAdminCompanyId(v);
                      const firstBu = adminCompanies?.find((c) => c.id === v)
                        ?.businessUnits?.[0]?.id;
                      setAdminBuId(firstBu || "");
                    }}
                    disabled={busy || companiesCount <= 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una compañía" />
                    </SelectTrigger>
                    <SelectContent>
                      {adminCompanies?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* ADMIN: BU por compañía */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Unidad de Negocio
                  </Label>
                  <Select
                    value={adminBuId}
                    onValueChange={setAdminBuId}
                    disabled={busy || !adminCompanyId || adminBusCount <= 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {adminCompanyBUs.map((bu) => (
                        <SelectItem key={bu.id} value={bu.id}>
                          {bu.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : showSelector ? (
              <div className="grid grid-cols-1 gap-4">
                {/* NO admin: selector de BU (>1) */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Selecciona tu unidad de negocio
                  </Label>
                  <Select
                    value={buId}
                    onValueChange={setBuId}
                    disabled={pendingBU || buCount <= 1}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Elige una unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessUnits?.map((bu) => (
                        <SelectItem key={bu.id} value={bu.id}>
                          {bu.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {/* Login */}
                <div className="space-y-2 login-email-field">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Correo electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="tu@empresa.com"
                      value={form.email}
                      onChange={onChange}
                      disabled={busy}
                      autoComplete="username"
                      required
                      className="pl-10"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2 login-password-field">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPwd ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={onChange}
                      disabled={busy}
                      autoComplete="current-password"
                      required
                      className="pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showPwd ? "Ocultar contraseña" : "Ver contraseña"
                      }
                    >
                      {showPwd ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                <div className="mt-1 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox id="remember" />
                    <span className="select-none text-muted-foreground">
                      Recordarme
                    </span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-[#2563eb] hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>
            )}
          </div>

          {errors.root && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {errors.root}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center gap-3">
          <Button
            type="submit"
            className="flex-1 bg-[linear-gradient(90deg,#FFA466_0%,#F25C4C_100%)] hover:opacity-95"
            disabled={busy || pendingBU}
          >
            {busy || pendingBU
              ? showAdminSelector
                ? "Aplicando..."
                : showSelector
                ? "Aplicando..."
                : "Ingresando..."
              : "Iniciar sesión"}
          </Button>

          {(showSelector || showAdminSelector) && (
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={busy || pendingBU}
              onClick={() => {
                toast.info("Volviendo a login para cambiar de cuenta.");
                clearBusinessUnit();
                clearSelectedCompanyId();
                setPositionId(null);
                setPhase("login");
              }}
            >
              Cambiar de cuenta
            </Button>
          )}
        </CardFooter>
      </form>

      {getAccessToken() && me?.fullName && (
        <div className="px-6 pb-6">
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Sesión de <span className="font-medium">{me.fullName}</span>
          </p>
        </div>
      )}
    </Card>
  );
}
