"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import http from "@/shared/api/http";
import { unwrapAny, getHumanErrorMessage } from "@/shared/api/response";

// shadcn/ui
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

export default function ConfirmEmailPage() {
  const search = useSearchParams();
  const router = useRouter();

  const tokenFromUrl = search?.get("token") ?? "";
  const [token, setToken] = React.useState(tokenFromUrl);
  const [loading, setLoading] = React.useState(false);

  const hasUrlToken = !!tokenFromUrl;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      toast.error("Pega tu token de confirmación.");
      return;
    }
    try {
      setLoading(true);
      const res = await http.post("/api/v1/auth/confirm", { token });
      unwrapAny(res); // nos basta con que no lance error
      toast.success("Correo confirmado correctamente.");
      router.replace("/login");
    } catch (err) {
      toast.error(getHumanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Confirmar correo</CardTitle>
        <CardDescription>
          {hasUrlToken
            ? "Usaremos el token del enlace."
            : "Pega el token de confirmación que recibiste por correo."}
        </CardDescription>
      </CardHeader>

      <form onSubmit={onSubmit}>
        <CardContent className="space-y-5 px-6 sm:px-8">
          <div className="space-y-2">
            <Label className="text-sm font-medium" htmlFor="token">
              Token
            </Label>
            <Input
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="h-11 text-base"
              placeholder="eac3c463-...."
              readOnly={hasUrlToken}
            />
            {!hasUrlToken && (
              <p className="text-xs text-muted-foreground">
                Pega aquí el token si tu enlace no funcionó.
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            className="btn-gradient h-11 text-base w-full"
            disabled={loading}
          >
            {loading ? "Confirmando…" : "Confirmar correo"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
