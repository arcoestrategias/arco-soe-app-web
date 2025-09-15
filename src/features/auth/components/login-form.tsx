"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getHumanErrorMessage } from "@/shared/api/response";

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

import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

import {
  getAccessToken,
  setBusinessUnitId,
  setPositionId,
  getBusinessUnitId,
  getCompanyId,
  setCompanyId,
  clearAuthSession,
} from "@/shared/auth/storage";

import { authService } from "../services/authService";
import { ActionButton } from "@/components/ui/action-button";

type Props = {
  defaultRedirectTo?: string;
};

export default function LoginForm({ defaultRedirectTo = "/" }: Props) {
  // --- Modo de pantalla
  const [mode, setMode] = React.useState<"login" | "recover">("login");

  // --- Estados de envío
  const [recovering, setRecovering] = React.useState(false);
  const [loggingIn, setLoggingIn] = React.useState(false);
  const [applying, setApplying] = React.useState(false); // admin: aplicar company/BU
  const [pendingBU, setPendingBU] = React.useState(false); // no-admin: aplicar BU

  const [uiLocked, setUiLocked] = React.useState(false);

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

  // --- Estado común de formulario
  const [form, setForm] = React.useState({ email: "", password: "" });
  const [errors, setErrors] = React.useState<{
    email?: string;
    password?: string;
    root?: string;
  }>({});
  const [showPwd, setShowPwd] = React.useState(false);

  const redirectTo = React.useMemo(() => {
    const q = search?.get("redirect");
    return q && q.startsWith("/") ? q : defaultRedirectTo;
  }, [search, defaultRedirectTo]);

  React.useEffect(() => {
    if (!redirectTo) return;
    const go =
      redirectTo && redirectTo !== "/login" && redirectTo !== "/"
        ? redirectTo
        : "/resume";
    router.prefetch(go);
  }, [redirectTo, router]);

  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // ---- logged state desde storage
  const isLogged = !!getAccessToken();

  // ---- NO ADMIN (selector BU)
  const buCount = businessUnits?.length ?? 0;
  const [buId, setBuId] = React.useState<string>("");

  // ---- ADMIN (selectores locales)
  const isAdmin = !!me?.isPlatformAdmin;
  const adminCompanies = React.useMemo(() => me?.companies ?? [], [me]);
  const companiesCount = adminCompanies?.length ?? 0;
  const [adminCompanyId, setAdminCompanyId] = React.useState<string>("");
  const adminSelectedCompany = React.useMemo(
    () => adminCompanies?.find((c) => c.id === adminCompanyId) || null,
    [adminCompanies, adminCompanyId]
  );
  const adminCompanyBUs = adminSelectedCompany?.businessUnits ?? [];
  const [adminBuId, setAdminBuId] = React.useState<string>("");

  // Persistir positionId según /me (NO admin) o null (admin)
  React.useEffect(() => {
    if (!isLogged) return;
    if (isAdmin) {
      setPositionId(null);
      return;
    }
    const pos = me?.currentBusinessUnit?.positionId ?? null;
    setPositionId(pos);
  }, [isLogged, isAdmin, me?.currentBusinessUnit?.positionId]);

  // ---- Flags de UI
  const nonAdminNeedsSelector =
    isLogged && !isAdmin && needsSelection && buCount > 1;

  const adminNeedsSelector =
    isLogged && isAdmin && (!getCompanyId() || !getBusinessUnitId());

  const showSelectorsSection =
    mode === "login" && (adminNeedsSelector || nonAdminNeedsSelector);

  // ---- Redirección automática si ya no se requiere selección
  const didRedirectRef = React.useRef(false);
  React.useEffect(() => {
    if (initializing) return;

    const token = getAccessToken();
    if (!token) return;

    const go =
      redirectTo && redirectTo !== "/login" && redirectTo !== "/"
        ? redirectTo
        : "";

    if (!isAdmin && !needsSelection) {
      if (!didRedirectRef.current) {
        didRedirectRef.current = true;
        router.replace(go);
      }
      return;
    }

    if (isAdmin && getCompanyId() && getBusinessUnitId()) {
      if (!didRedirectRef.current) {
        didRedirectRef.current = true;
        router.replace(go);
      }
      return;
    }
  }, [initializing, isAdmin, needsSelection, router, redirectTo]);

  // ---- Auto-selección NO admin si solo hay 1 BU
  const didAutoSelectRef = React.useRef(false);
  React.useEffect(() => {
    if (!isLogged || isAdmin) return;
    if (!needsSelection) return;
    if (buCount !== 1) return;
    if (didAutoSelectRef.current) return;
    didAutoSelectRef.current = true;

    const only = businessUnits?.[0];
    if (!only) return;

    (async () => {
      try {
        // flujo silencioso
        setBusinessUnitId(only.id);
        setPositionId(only?.positionId ?? null);
        reloadMe().catch(() => {});
        const go =
          redirectTo && redirectTo !== "/login" && redirectTo !== "/"
            ? redirectTo
            : "/resume";
        router.replace(go);
      } catch (err) {
        toast.error(getHumanErrorMessage(err));
      }
    })();
  }, [
    isLogged,
    isAdmin,
    needsSelection,
    buCount,
    businessUnits,
    reloadMe,
    router,
    redirectTo,
  ]);

  // ---- Inicializa selects ADMIN
  const adminInitedRef = React.useRef(false);
  React.useEffect(() => {
    if (!adminNeedsSelector) {
      adminInitedRef.current = false;
      return;
    }
    if (adminInitedRef.current) return;
    if (!companiesCount) return;

    const storedCompanyId = getCompanyId();
    const firstCompanyId = adminCompanies?.[0]?.id ?? "";
    const candidateCompanyId =
      (storedCompanyId &&
        adminCompanies?.some((c) => c.id === storedCompanyId) &&
        storedCompanyId) ||
      firstCompanyId;

    setAdminCompanyId(candidateCompanyId);

    const company =
      adminCompanies?.find((c) => c.id === candidateCompanyId) ||
      adminCompanies?.[0];
    const firstBu = company?.businessUnits?.[0]?.id ?? "";
    setAdminBuId(firstBu);

    adminInitedRef.current = true;
  }, [adminNeedsSelector, companiesCount, adminCompanies]);

  // ---- Estado visual de botón principal
  const busy = loading || initializing;
  const inSelectionPhase = adminNeedsSelector || nonAdminNeedsSelector;

  const submitting =
    mode === "recover"
      ? recovering
      : adminNeedsSelector
      ? applying
      : nonAdminNeedsSelector
      ? pendingBU
      : loggingIn;

  const primaryLabel =
    mode === "recover"
      ? recovering
        ? "Enviando…"
        : "Recuperar contraseña"
      : busy || pendingBU
      ? inSelectionPhase
        ? "Aplicando..."
        : "Ingresando..."
      : inSelectionPhase
      ? "Aplicar"
      : "Iniciar sesión";

  // ---- Helpers de navegación
  const goAfter = React.useCallback(() => {
    const go =
      redirectTo && redirectTo !== "/login" && redirectTo !== "/"
        ? redirectTo
        : "";
    router.replace(go);
  }, [redirectTo, router]);

  // ---- Handler del botón principal
  const handlePrimary = async () => {
    setErrors({});

    // Si está bloqueado por un flujo previo, ignorar
    if (uiLocked) return;

    // Validaciones sin bloquear UI (rápidas)
    if (mode === "recover") {
      const email = form.email.trim();
      if (!email) {
        setErrors((p) => ({ ...p, email: "Ingresa tu correo" }));
        return;
      }
      if (!isEmail(email)) {
        setErrors((p) => ({ ...p, email: "Correo inválido" }));
        return;
      }
    } else if (!isLogged && !inSelectionPhase) {
      // Login normal: valida campos antes de bloquear
      const email = form.email.trim();
      const password = form.password;
      if (!email) {
        setErrors((p) => ({ ...p, email: "Ingresa tu correo" }));
        return;
      }
      if (!isEmail(email)) {
        setErrors((p) => ({ ...p, email: "Correo inválido" }));
        return;
      }
      if (!password || password.length < 6) {
        setErrors((p) => ({ ...p, password: "Mínimo 6 caracteres" }));
        return;
      }
    } else if (adminNeedsSelector) {
      if (!companiesCount) {
        setErrors((p) => ({
          ...p,
          root: "Cargando compañías… intenta en unos segundos.",
        }));
        return;
      }
      if (!adminCompanyId) {
        setErrors((p) => ({ ...p, root: "Selecciona una compañía." }));
        return;
      }
      if (!adminBuId) {
        setErrors((p) => ({ ...p, root: "Selecciona una unidad de negocio." }));
        return;
      }
      // Si ya coincide con lo persistido, evita re-aplicar
      const alreadyApplied =
        getCompanyId() === adminCompanyId && getBusinessUnitId() === adminBuId;
      if (alreadyApplied) {
        toast.info("Contexto ya aplicado.");
        goAfter();
        return;
      }
    } else if (nonAdminNeedsSelector) {
      if (!buId) {
        setErrors((p) => ({
          ...p,
          root: "Selecciona una unidad de negocio para continuar.",
        }));
        return;
      }
    }

    // A partir de aquí sí bloqueamos duro la UI para evitar doble click
    setUiLocked(true);

    try {
      // Recuperación
      if (mode === "recover") {
        setRecovering(true);
        const data = await authService.forgotPassword(form.email.trim());
        toast.success("Si el correo existe, te enviaremos instrucciones.");
        if (data?.resetToken) setMode("login");
        // éxito: no des-bloqueamos; no hay endpoint repetible aquí y el usuario puede seguir
        setUiLocked(false); // en recover sí desbloqueamos para permitir login
        setRecovering(false);
        return;
      }

      // ADMIN: aplicar selección (persistir y salir)
      if (adminNeedsSelector) {
        setApplying(true);
        setCompanyId(adminCompanyId);
        setBusinessUnitId(adminBuId);
        setPositionId(null);
        toast.success("Compañía y Unidad de negocio seleccionadas");
        goAfter(); // éxito => mantenemos uiLocked=true hasta navegar
        return;
      }

      // NO admin: aplicar BU (>1)
      if (nonAdminNeedsSelector) {
        setPendingBU(true);
        await selectBusinessUnit(buId, { fireAndForget: true });
        const sel = businessUnits?.find((b) => b.id === buId);
        setPositionId(sel?.positionId ?? null);
        toast.success("Unidad de negocio seleccionada");
        goAfter(); // éxito => mantenemos uiLocked=true hasta navegar
        return;
      }

      // LOGIN normal
      setLoggingIn(true);
      await login({ email: form.email.trim(), password: form.password });
      toast.success("Inicio de sesión exitoso");
      // Si falta contexto, aparecerán los selectores
      setUiLocked(false); // tras login permitimos interacción con selectores
      setLoggingIn(false);
    } catch (err) {
      const msg = getHumanErrorMessage(err);
      setErrors((p) => ({ ...p, root: msg }));
      toast.error(msg);
      // ERROR => desbloqueamos para permitir reintentar
      setUiLocked(false);
      setRecovering(false);
      setApplying(false);
      setPendingBU(false);
      setLoggingIn(false);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <Card className="mx-auto w-full max-w-lg shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {mode === "recover"
            ? "Recuperar contraseña"
            : "Iniciar sesión en SOE"}
        </CardTitle>
        <CardDescription>
          {mode === "recover"
            ? "Ingresa tu correo y te enviaremos instrucciones para restablecerla"
            : "Accede a tu cuenta para continuar"}
        </CardDescription>
      </CardHeader>

      {/* Evitamos submit nativo y bloqueamos Enter en fase de selección */}
      <form
        onSubmit={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (
            (adminNeedsSelector || nonAdminNeedsSelector) &&
            e.key === "Enter"
          ) {
            e.preventDefault();
          }
        }}
      >
        <CardContent className="space-y-6 px-6 sm:px-8">
          {/* Login siempre visible */}
          <div className="grid grid-cols-1 gap-5">
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
                  disabled={
                    loading ||
                    initializing ||
                    (mode === "login" && isLogged) ||
                    recovering ||
                    uiLocked
                  }
                  autoComplete="username"
                  required
                  className="h-11 pl-11 text-base"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {mode === "login" && (
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
                    disabled={
                      loading ||
                      initializing ||
                      isLogged ||
                      loggingIn ||
                      uiLocked
                    }
                    autoComplete="current-password"
                    required
                    className="h-11 pl-11 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    aria-label={
                      showPwd ? "Ocultar contraseña" : "Ver contraseña"
                    }
                    disabled={
                      loading ||
                      initializing ||
                      isLogged ||
                      loggingIn ||
                      uiLocked
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
            )}

            {/* Recordarme / Forgot */}
            {mode === "login" ? (
              <div className="pt-2 mb-3 flex items-center justify-between flex-wrap gap-x-3 gap-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    id="remember"
                    disabled={loading || initializing || isLogged}
                  />
                  <span className="select-none text-muted-foreground">
                    Recordarme
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setMode("recover")}
                  className="text-sm text-[#2563eb] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Ingresa tu correo y presiona{" "}
                <span className="font-medium">Recuperar contraseña</span>.{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-[#2563eb] hover:underline"
                >
                  Volver a iniciar sesión
                </button>
              </div>
            )}
          </div>

          {/* Sección condicional debajo del login */}
          {adminNeedsSelector && (
            <div className="grid grid-cols-1 gap-5 pt-2">
              {/* ADMIN: Compañía (estado local) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Compañía</Label>
                <Select
                  value={adminCompanyId}
                  onValueChange={(v) => {
                    setAdminCompanyId(v);
                    const firstBu =
                      adminCompanies?.find((c) => c.id === v)
                        ?.businessUnits?.[0]?.id ?? "";
                    setAdminBuId(firstBu);
                  }}
                  disabled={
                    loading ||
                    initializing ||
                    companiesCount <= 0 ||
                    applying ||
                    uiLocked
                  }
                >
                  <SelectTrigger className="w-full h-11 text-base">
                    <SelectValue
                      placeholder={
                        companiesCount
                          ? "Selecciona una compañía"
                          : "Cargando compañías…"
                      }
                    />
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

              {/* ADMIN: Unidad de Negocio (estado local) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Unidad de Negocio</Label>
                <Select
                  value={adminBuId}
                  onValueChange={(v) => setAdminBuId(v)}
                  disabled={
                    loading ||
                    initializing ||
                    !adminCompanyId ||
                    adminCompanyBUs.length <= 0 ||
                    applying ||
                    uiLocked
                  }
                >
                  <SelectTrigger className="w-full h-11 text-base">
                    <SelectValue
                      placeholder={
                        adminCompanyId
                          ? adminCompanyBUs.length
                            ? "Selecciona una unidad"
                            : "Cargando unidades…"
                          : "Elige una compañía primero"
                      }
                    />
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
          )}

          {nonAdminNeedsSelector && (
            <div className="grid grid-cols-1 gap-5 pt-2">
              {/* NO admin: selector de BU (>1) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Selecciona tu unidad de negocio
                </Label>
                <Select
                  value={buId}
                  onValueChange={setBuId}
                  disabled={pendingBU || buCount <= 1 || uiLocked}
                >
                  <SelectTrigger className="w-full h-11 text-base">
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
          )}

          {errors.root && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {errors.root}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center gap-3 mt-4">
          <Button
            type="button"
            onClick={handlePrimary}
            className={`flex-1 btn-gradient h-11 text-base`}
            // disabled si hay envío OR bloqueo duro de UI
            disabled={submitting || uiLocked}
            aria-busy={submitting || uiLocked}
          >
            {submitting || uiLocked ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {primaryLabel}
              </span>
            ) : (
              primaryLabel
            )}
          </Button>

          {isLogged && showSelectorsSection && (
            <ActionButton
              label="Cambiar de cuenta"
              type="button"
              variant="secondary"
              onAction={() => {
                toast.info("Volviendo a login para cambiar de cuenta.");
                clearAuthSession();
                setErrors({});
              }}
              className="btn-gradient flex-1 h-11 text-base"
            />
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
