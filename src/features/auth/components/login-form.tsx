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
  setTokens,
  setBusinessUnitId,
  setPositionId,
  getBusinessUnitId,
  getCompanyId,
  setCompanyId,
  clearAuthSession,
} from "@/shared/auth/storage";

import { authService } from "../services/authService";
import { ActionButton } from "@/components/ui/action-button";
import { AcceptTermsModal, type TermsData } from "./modal-terms";

type Props = {
  defaultRedirectTo?: string;
};

export default function LoginForm({ defaultRedirectTo = "/" }: Props) {
  const [mode, setMode] = React.useState<"login" | "recover">("login");

  const [recovering, setRecovering] = React.useState(false);
  const [loggingIn, setLoggingIn] = React.useState(false);
  const [applying, setApplying] = React.useState(false);
  const [pendingBU, setPendingBU] = React.useState(false);

  const [uiLocked, setUiLocked] = React.useState(false);

  const [showTerms, setShowTerms] = React.useState(false);
  const [termsData, setTermsData] = React.useState<TermsData | null>(null);
  const [pendingTokens, setPendingTokens] = React.useState<{
    accessToken: string;
    refreshToken?: string;
  } | null>(null);

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

  // ─── NUEVO: manejar callback de Google OAuth ───────────────────────────────
  const googleCallbackHandled = React.useRef(false);
  React.useEffect(() => {
    const authParam = search?.get("auth");
    const needsTerms = search?.get("needsTermsAcceptance") === "true";

    if (authParam !== "success") return;
    if (googleCallbackHandled.current) return;
    googleCallbackHandled.current = true;

    (async () => {
      try {
        if (needsTerms) {
          const terms = await authService.getCurrentTerms();
          setTermsData(terms as TermsData);
          setPendingTokens({ accessToken: "" });
          setShowTerms(true);
        } else {
          // Guardar tokens en localStorage para que AppShell los detecte
          const token = search?.get("token");
          const refreshToken = search?.get("refreshToken");
          if (token) setTokens(token, refreshToken ?? null);

          await reloadMe();
          // Forzar selección de BU y redirigir desde aquí,
          // ya que getAccessToken() es null con cookies HttpOnly
          const meData = await authService.me();
          const firstBU = meData.businessUnits?.[0];
          if (firstBU) {
            setBusinessUnitId(firstBU.id);
            setPositionId(firstBU.positionId ?? null);
            setCompanyId(meData.currentCompanyId ?? null);
          }
          toast.success("Inicio de sesión exitoso");
          window.location.href =
            redirectTo && redirectTo !== "/login" && redirectTo !== "/"
              ? redirectTo
              : "/resume";
        }
      } catch (err) {
        toast.error("Error al completar el inicio de sesión con Google");
        console.error("[Google OAuth callback]", err);
      }
    })();
  }, [search, reloadMe, redirectTo, router]);
  // ──────────────────────────────────────────────────────────────────────────

  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const isLogged = !!getAccessToken();

  const buCount = businessUnits?.length ?? 0;
  const [buId, setBuId] = React.useState<string>("");

  const isAdmin = !!me?.isPlatformAdmin;
  const adminCompanies = React.useMemo(() => me?.companies ?? [], [me]);
  const companiesCount = adminCompanies?.length ?? 0;
  const [adminCompanyId, setAdminCompanyId] = React.useState<string>("");
  const adminSelectedCompany = React.useMemo(
    () => adminCompanies?.find((c) => c.id === adminCompanyId) || null,
    [adminCompanies, adminCompanyId],
  );
  const adminCompanyBUs = adminSelectedCompany?.businessUnits ?? [];
  const [adminBuId, setAdminBuId] = React.useState<string>("");

  React.useEffect(() => {
    if (!isLogged) return;
    if (isAdmin) {
      setPositionId(null);
      return;
    }
    const pos = me?.currentBusinessUnit?.positionId ?? null;
    setPositionId(pos);
  }, [isLogged, isAdmin, me?.currentBusinessUnit?.positionId]);

  const nonAdminNeedsSelector =
    isLogged && !isAdmin && needsSelection && buCount > 1;

  const adminNeedsSelector =
    isLogged && isAdmin && (!getCompanyId() || !getBusinessUnitId());

  const showSelectorsSection =
    mode === "login" && (adminNeedsSelector || nonAdminNeedsSelector);

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
          ? "Ingresar"
          : "Iniciar sesión";

  const goAfter = React.useCallback(() => {
    const go =
      redirectTo && redirectTo !== "/login" && redirectTo !== "/"
        ? redirectTo
        : "";
    router.replace(go);
  }, [redirectTo, router]);

  const handlePrimary = async () => {
    setErrors({});

    if (uiLocked) return;

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

    setUiLocked(true);

    try {
      if (mode === "recover") {
        setRecovering(true);
        const data = await authService.forgotPassword(form.email.trim());
        toast.success("Si el correo existe, te enviaremos instrucciones.");
        if (data?.resetToken) setMode("login");
        setUiLocked(false);
        setRecovering(false);
        return;
      }

      if (adminNeedsSelector) {
        setApplying(true);
        setCompanyId(adminCompanyId);
        setBusinessUnitId(adminBuId);
        setPositionId(null);
        toast.success("Compañía y Unidad de negocio seleccionadas");
        goAfter();
        return;
      }

      if (nonAdminNeedsSelector) {
        setPendingBU(true);
        await selectBusinessUnit(buId, { fireAndForget: true });
        const sel = businessUnits?.find((b) => b.id === buId);
        setPositionId(sel?.positionId ?? null);
        toast.success("Unidad de negocio seleccionada");
        goAfter();
        return;
      }

      setLoggingIn(true);
      const loginResult = await authService.login({
        email: form.email.trim(),
        password: form.password,
      });

      if (loginResult.needsTermsAcceptance && loginResult.terms) {
        setPendingTokens({
          accessToken: loginResult.accessToken,
          refreshToken: loginResult.refreshToken,
        });
        setTermsData(loginResult.terms);
        setShowTerms(true);
        setLoggingIn(false);
        return;
      }

      setTokens(loginResult.accessToken, loginResult.refreshToken ?? null);
      await login({ email: form.email.trim(), password: form.password });
      toast.success("Inicio de sesión exitoso");
      setUiLocked(false);
      setLoggingIn(false);
    } catch (err) {
      const msg = getHumanErrorMessage(err);
      setErrors((p) => ({ ...p, root: msg }));
      toast.error(msg);
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
    <>
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

            {/* Separador — solo visible cuando no hay sesión activa */}
            {mode === "login" && !isLogged && !inSelectionPhase && (
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    O
                  </span>
                </div>
              </div>
            )}

            {/* ─── NUEVO: Botón Google habilitado ─────────────────────────── */}
            {mode === "login" && !isLogged && !inSelectionPhase && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 text-base"
                onClick={() => {
                  const baseUrl =
                    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
                    "http://localhost:4000";
                  window.location.href = `${baseUrl}/api/v1/auth/google`;
                }}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 4.19v3.37h3.57c2.09-1.93 3.27-4.77 3.27-8.57z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.64l-3.57-3.37c-.98.66-2.23 1.05-3.71 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v3.44C3.97 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V6.47H2.18C1.43 8.07 1 9.93 1 12s.43 3.93 1.18 5.53l3.66-3.44z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.25-3.16C17.45 2.09 14.97 1 12 1 7.7 1 3.97 3.47 2.18 6.47l3.66 3.44C6.71 7.31 9.14 5.38 12 5.38z"
                    fill="#EA4335"
                  />
                </svg>
                Ingresar con Google
              </Button>
            )}
            {/* ──────────────────────────────────────────────────────────────── */}

            {adminNeedsSelector && (
              <div className="grid grid-cols-1 gap-5 pt-2">
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

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Unidad de Negocio
                  </Label>
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
              type="submit"
              onClick={handlePrimary}
              className={`flex-1 btn-gradient h-11 text-base`}
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

      {showTerms && termsData && (
        <AcceptTermsModal
          open={showTerms}
          terms={termsData as TermsData}
          // Cuando el login es por Google las cookies ya están seteadas,
          // así que pasamos strings vacíos — AcceptTermsModal los usa solo
          // para el flujo de email/password. Si el modal los necesita,
          // ajusta según la implementación de modal-terms.tsx.
          accessToken={pendingTokens?.accessToken ?? ""}
          refreshToken={pendingTokens?.refreshToken}
          onAccepted={async () => {
            setShowTerms(false);
            await reloadMe();
            toast.success("Inicio de sesión exitoso");
            const go =
              redirectTo && redirectTo !== "/login" && redirectTo !== "/"
                ? redirectTo
                : "/resume";
            router.replace(go);
          }}
          onError={(msg: string) => {
            setErrors((p) => ({ ...p, root: msg }));
            toast.error(msg);
          }}
        />
      )}
    </>
  );
}
