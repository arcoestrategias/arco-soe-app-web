"use client";

import * as React from "react";
import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QKEY } from "@/shared/api/query-keys";
import { getHumanErrorMessage } from "@/shared/api/response";
import { toast } from "sonner";
import {
  getUserPermissions,
  updateUserPermissions,
  type PermissionModules,
} from "@/features/users/services/userPermissionsService";

const PREFERRED_COLS = [
  "access",
  "create",
  "read",
  "update",
  "delete",
  "export",
  "approve",
  "assign",
] as const;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  businessUnitId: string;
  userName?: string;
  businessUnitName?: string;
};

function humanize(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (s) => s.toUpperCase());
}

function Dot({ ok }: { ok: boolean }) {
  return ok ? (
    <div className="flex items-center justify-center">
      <CheckCircle2 className="h-5 w-5 text-green-600" />
      <span className="sr-only">Permitido</span>
    </div>
  ) : (
    <div className="flex items-center justify-center">
      <XCircle className="h-5 w-5 text-red-500" />
      <span className="sr-only">No permitido</span>
    </div>
  );
}

export function ModalUserPermissions({
  isOpen,
  onClose,
  userId,
  businessUnitId,
  userName,
  businessUnitName,
}: Props) {
  const qc = useQueryClient();
  const enabled = isOpen && !!userId && !!businessUnitId;

  // ➜ v5: usar isPending en lugar de comparar status con "loading"
  const {
    data,
    error,
    isFetching,
    isPending: isQueryPending,
  } = useQuery({
    queryKey: QKEY.userPermissions(businessUnitId, userId),
    queryFn: () => getUserPermissions(businessUnitId, userId),
    enabled,
    staleTime: 60_000,
  });
  const isQueryLoading = isQueryPending;

  // Draft editable
  const [draft, setDraft] = useState<PermissionModules>({});
  useEffect(() => {
    if (data && isOpen) setDraft(data);
  }, [data, isOpen]);

  // Columnas presentes
  const cols = useMemo(() => {
    const present = new Set<string>();
    Object.values(draft ?? {}).forEach((flags) => {
      Object.keys(flags ?? {}).forEach((k) => present.add(k));
    });
    const ordered = PREFERRED_COLS.filter((k) => present.has(k));
    const extras = Array.from(present)
      .filter((k) => !ordered.includes(k as any))
      .sort();
    return [...ordered, ...extras] as Array<keyof PermissionModules[string]>;
  }, [draft]);

  // Filas
  const rows = useMemo(() => {
    const modules = draft ?? {};
    return Object.entries(modules).sort(([a], [b]) => a.localeCompare(b));
  }, [draft]);

  // Toggle celda
  const toggle = (moduleKey: string, actionKey: string) => {
    setDraft((prev) => {
      const current =
        prev?.[moduleKey]?.[actionKey as keyof PermissionModules[string]] ??
        false;
      return {
        ...prev,
        [moduleKey]: {
          ...(prev?.[moduleKey] ?? {}),
          [actionKey]: !current,
        },
      };
    });
  };

  // Dirty check
  const isDirty = useMemo(() => {
    if (!data) return false;
    try {
      return JSON.stringify(draft) !== JSON.stringify(data);
    } catch {
      return true;
    }
  }, [draft, data]);

  // ➜ v5: usar isPending en la mutación
  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      const permissions: Record<string, boolean> = {};
      Object.entries(draft ?? {}).forEach(([mod, flags]) => {
        Object.entries(flags ?? {}).forEach(([action, val]) => {
          permissions[`${mod}.${action}`] = !!val;
        });
      });
      return updateUserPermissions(businessUnitId, userId, permissions);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: QKEY.userPermissions(businessUnitId, userId),
      });
      toast.success("Permisos actualizados");
    },
    onError: (e: any) => {
      toast.error(getHumanErrorMessage(e));
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-foreground" />
            Permisos del usuario
          </DialogTitle>
          <div className="text-xs text-muted-foreground mt-1">
            <div>
              Usuario: <span className="font-medium">{userName ?? userId}</span>
            </div>
            <div>
              Unidad:{" "}
              <span className="font-medium">
                {businessUnitName ?? businessUnitId}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-muted-foreground">
            {isFetching
              ? "Actualizando permisos…"
              : isQueryLoading
              ? "Cargando permisos…"
              : null}
            {error ? (
              <span className="ml-2 text-red-600">
                {getHumanErrorMessage(error as any)}
              </span>
            ) : null}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              qc.invalidateQueries({
                queryKey: QKEY.userPermissions(businessUnitId, userId),
              })
            }
          >
            Refrescar
          </Button>
        </div>

        <div className="border rounded-md overflow-hidden">
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-left w-1/3">Módulo</th>
                  {cols.map((c) => (
                    <th key={String(c)} className="px-2 py-2 text-center">
                      {humanize(String(c))}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-3 text-muted-foreground"
                      colSpan={cols.length + 1}
                    >
                      {isQueryLoading
                        ? "Cargando…"
                        : "Sin permisos disponibles."}
                    </td>
                  </tr>
                ) : (
                  rows.map(([moduleKey, flags]) => (
                    <tr key={moduleKey} className="border-t">
                      <td className="px-4 py-2 font-medium">
                        {humanize(moduleKey)}
                      </td>
                      {cols.map((c) => {
                        const val = !!flags?.[c];
                        return (
                          <td key={String(c)} className="px-2 py-1">
                            <button
                              type="button"
                              className="w-full h-9 rounded-md border hover:bg-muted flex items-center justify-center"
                              onClick={() => toggle(moduleKey, String(c))}
                              aria-pressed={val}
                            >
                              <Dot ok={val} />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-3">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            className="btn-gradient"
            onClick={() => save()}
            disabled={!isDirty || isSaving || isQueryLoading}
          >
            {isSaving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
