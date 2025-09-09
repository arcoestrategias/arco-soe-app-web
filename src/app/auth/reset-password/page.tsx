"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getHumanErrorMessage } from "@/shared/api/response";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

// Icons
import { Eye, EyeOff, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { authService } from "@/features/auth/services/authService";

export default function ResetPasswordPage() {
  const search = useSearchParams();
  const router = useRouter();

  const tokenFromUrl = search?.get("token") ?? "";

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const hasToken = !!tokenFromUrl;

  // Validaciones en vivo
  const vMin = password.length >= 8;
  const vUpper = /[A-Z]/.test(password);
  const vLower = /[a-z]/.test(password);
  const vNumber = /[0-9]/.test(password);
  const vMatch = password.length > 0 && password === confirm;
  const allGood = vMin && vUpper && vLower && vNumber && vMatch;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!hasToken) {
      toast.error("Falta el token. Revisa el enlace del correo.");
      return;
    }
    if (!allGood) {
      toast.error("Revisa los requisitos de la contraseña.");
      return;
    }

    try {
      setLoading(true);
      const data = await authService.resetPassword(tokenFromUrl, password);
      toast.success(data.message);
      router.replace("/login");
    } catch (err) {
      toast.error(getHumanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const Rule = ({
    ok,
    children,
  }: {
    ok: boolean;
    children: React.ReactNode;
  }) => (
    <li className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>
        {children}
      </span>
    </li>
  );

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <div className="mb-6 flex justify-center">
            <Image
              src="/logo-soe.svg"
              alt="SOE"
              width={160}
              height={40}
              priority
              className="h-auto w-40"
            />
          </div>

          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Restablecer contraseña</CardTitle>
            <CardDescription>Usaremos el token del enlace.</CardDescription>
          </CardHeader>

          <form onSubmit={onSubmit}>
            <CardContent className="space-y-6 px-6 sm:px-8">
              {!hasToken && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  No se encontró el token en la URL. Vuelve a abrir el enlace
                  del correo de recuperación.
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium" htmlFor="password">
                  Nueva contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 text-base pr-11"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={loading}
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
                <p className="text-xs text-muted-foreground">
                  Mínimo 8 caracteres, con letras <strong>mayúsculas</strong>,{" "}
                  <strong>minúsculas</strong> y <strong>números</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium" htmlFor="confirm">
                  Confirmar contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="h-11 text-base pr-11"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    aria-label={
                      showConfirm ? "Ocultar contraseña" : "Ver contraseña"
                    }
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Checklist en vivo */}
              <ul className="space-y-1.5">
                <Rule ok={vMin}>Al menos 8 caracteres</Rule>
                <Rule ok={vUpper}>Incluye una letra mayúscula (A–Z)</Rule>
                <Rule ok={vLower}>Incluye una letra minúscula (a–z)</Rule>
                <Rule ok={vNumber}>Incluye un número (0–9)</Rule>
                <Rule ok={vMatch}>Las contraseñas coinciden</Rule>
              </ul>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                type="submit"
                className="btn-gradient h-11 text-base w-full"
                disabled={loading || !hasToken || !allGood}
                aria-busy={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Actualizando…
                  </span>
                ) : (
                  "Restablecer contraseña"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
