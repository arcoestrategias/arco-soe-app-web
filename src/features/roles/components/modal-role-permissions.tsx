"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  Info,
  Loader2,
  Save,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

import {
  useRolePermissionsQuery,
  useUpdateRolePermissionsMutation,
} from "../hooks/use-roles";
import type { RolePermission } from "../types/types";

interface ModalRolePermissionsProps {
  isOpen: boolean;
  onClose: () => void;
  roleId: string | null;
  roleName?: string;
}

export function ModalRolePermissions({
  isOpen,
  onClose,
  roleId,
  roleName,
}: ModalRolePermissionsProps) {
  const { data: permissions, isLoading } = useRolePermissionsQuery(roleId);
  const updateMutation = useUpdateRolePermissionsMutation();

  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (permissions) {
      const active = new Set(
        permissions.filter((p) => p.isActive).map((p) => p.id)
      );
      setActiveIds(active);
    }
  }, [permissions, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setExpandedModules(new Set());
    }
  }, [isOpen]);

  const handleToggle = (id: string, checked: boolean) => {
    const next = new Set(activeIds);
    if (checked) next.add(id);
    else next.delete(id);
    setActiveIds(next);
  };

  const handleSave = () => {
    if (!roleId || !permissions) return;

    const payload = {
      permissions: permissions.map((p) => ({
        id: p.id,
        isActive: activeIds.has(p.id),
      })),
    };

    updateMutation.mutate(
      { roleId, payload },
      {
        onSuccess: () => {
          toast.success("Permisos actualizados correctamente.");
          onClose();
        },
        onError: () => {
          toast.error("Error al actualizar permisos.");
        },
      }
    );
  };

  // Agrupar catálogo por módulo
  const groupedPermissions = useMemo(() => {
    if (!permissions) return {};
    return permissions.reduce((acc, p) => {
      const mod = p.module || "General";
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(p);
      return acc;
    }, {} as Record<string, RolePermission[]>);
  }, [permissions]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  // Filtro de búsqueda
  const filteredGroupedPermissions = useMemo(() => {
    if (!normalizedSearch) return groupedPermissions;

    const result: Record<string, RolePermission[]> = {};
    Object.entries(groupedPermissions).forEach(([moduleName, perms]) => {
      const filtered = perms.filter((p) => {
        const text = `${p.description || ""} ${p.name || ""}`.toLowerCase();
        return text.includes(normalizedSearch);
      });
      if (filtered.length > 0) {
        result[moduleName] = filtered;
      }
    });

    return result;
  }, [groupedPermissions, normalizedSearch]);

  const sortedModules = useMemo(
    () => Object.keys(filteredGroupedPermissions).sort(),
    [filteredGroupedPermissions]
  );

  // Select all por grupo
  const handleToggleGroup = (
    moduleName: string,
    checked: boolean | "indeterminate"
  ) => {
    const permsInGroup = groupedPermissions[moduleName] ?? [];
    const next = new Set(activeIds);

    if (checked === true) {
      permsInGroup.forEach((p) => next.add(p.id));
    } else {
      permsInGroup.forEach((p) => next.delete(p.id));
    }

    setActiveIds(next);
  };

  // Expand/collapse módulo + su par de fila
  const toggleModule = (moduleName: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      const index = sortedModules.indexOf(moduleName);

      if (index === -1) {
        if (next.has(moduleName)) next.delete(moduleName);
        else next.add(moduleName);
        return next;
      }

      const partnerIndex = index % 2 === 0 ? index + 1 : index - 1;
      const partnerName =
        partnerIndex >= 0 && partnerIndex < sortedModules.length
          ? sortedModules[partnerIndex]
          : undefined;

      const willExpand = !next.has(moduleName);

      if (willExpand) {
        next.add(moduleName);
        if (partnerName) next.add(partnerName);
      } else {
        next.delete(moduleName);
        if (partnerName) next.delete(partnerName);
      }

      return next;
    });
  };

  // Expandir / colapsar todos
  const allExpanded =
    sortedModules.length > 0 && expandedModules.size === sortedModules.length;

  const handleToggleAllModules = () => {
    if (allExpanded) {
      setExpandedModules(new Set());
    } else {
      setExpandedModules(new Set(sortedModules));
    }
  };

  const totalPerms = permissions?.length ?? 0;
  const totalActive = permissions
    ? permissions.filter((p) => activeIds.has(p.id)).length
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Modal ancho y solo scroll vertical */}
      <DialogContent className="sm:max-w-6xl w-[95vw] max-h-[80vh] overflow-y-auto overflow-x-hidden">
        {/* Título + descripción (solo) */}
        <DialogHeader className="pb-2">
          <DialogTitle>Permisos del Rol: {roleName}</DialogTitle>
          <DialogDescription>
            Activa o desactiva los permisos para este rol.
          </DialogDescription>
        </DialogHeader>

        {/* TOOLBAR: buscador + resumen + acciones */}
        <div className="mb-4 mt-1 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Buscador (izquierda, ocupa espacio) */}
          <div className="flex-1 max-w-xl space-y-1">
            <Label htmlFor="perm-search" className="text-sm font-medium">
              Buscar permisos
            </Label>
            <Input
              id="perm-search"
              placeholder="Busca por descripción o código del permiso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Centro: resumen */}
          <div className="md:text-center text-sm text-muted-foreground">
            Permisos activos:{" "}
            <span className="font-semibold text-foreground">{totalActive}</span>{" "}
            / {totalPerms}
          </div>

          {/* Derecha: acciones */}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              className="text-sm"
              onClick={handleToggleAllModules}
              disabled={sortedModules.length === 0}
            >
              {allExpanded ? "Colapsar todos" : "Expandir todos"}
            </Button>

            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>

            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending || isLoading}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </div>
        </div>

        <TooltipProvider delayDuration={200}>
          <div className="py-2">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !permissions || permissions.length === 0 ? (
              <div className="text-center text-muted-foreground p-4">
                No hay permisos disponibles.
              </div>
            ) : sortedModules.length === 0 ? (
              <div className="text-center text-muted-foreground p-4">
                No se encontraron permisos que coincidan con la búsqueda.
              </div>
            ) : (
              // 2 grupos por fila
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {sortedModules.map((moduleName) => {
                  const permsInFilteredGroup =
                    filteredGroupedPermissions[moduleName] || [];
                  const permsInFullGroup = groupedPermissions[moduleName] || [];

                  const totalGroupPerms = permsInFullGroup.length;
                  const selectedInGroup = permsInFullGroup.filter((p) =>
                    activeIds.has(p.id)
                  ).length;

                  const allSelectedGroup =
                    totalGroupPerms > 0 && selectedInGroup === totalGroupPerms;
                  const someSelectedGroup =
                    selectedInGroup > 0 && !allSelectedGroup;

                  const isExpanded = expandedModules.has(moduleName);

                  return (
                    <div
                      key={moduleName}
                      className="border rounded-lg p-3 flex flex-col gap-3 bg-muted/30"
                    >
                      {/* Header del grupo */}
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => toggleModule(moduleName)}
                          className="flex items-start gap-2 flex-1 text-left rounded-md -m-1 p-1 cursor-pointer hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 mt-0.5" />
                          ) : (
                            <ChevronRight className="h-4 w-4 mt-0.5" />
                          )}

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">
                                {moduleName}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {selectedInGroup}/{totalGroupPerms} activos
                              {normalizedSearch &&
                                ` · ${permsInFilteredGroup.length} coinciden con la búsqueda`}
                            </p>
                          </div>
                        </button>

                        {/* Select all del grupo (NO es clickeable para expandir) */}
                        <div className="flex items-center gap-2 ml-2">
                          <Checkbox
                            checked={allSelectedGroup} // solo true cuando todos están activos
                            onCheckedChange={(checked) =>
                              handleToggleGroup(moduleName, checked)
                            }
                            id={`group-${moduleName}`}
                          />
                          <Label
                            htmlFor={`group-${moduleName}`}
                            className="text-xs cursor-pointer text-muted-foreground"
                          >
                            Seleccionar todo
                          </Label>
                        </div>
                      </div>

                      {/* Lista de permisos (1 col en la mayoría, 2 col en pantallas muy grandes si quieres) */}
                      {isExpanded && (
                        <>
                          {permsInFilteredGroup.length === 0 ? (
                            <div className="text-xs text-muted-foreground italic">
                              Ningún permiso de este módulo coincide con la
                              búsqueda.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                              {permsInFilteredGroup.map((perm) => (
                                <div
                                  key={perm.id}
                                  className="flex justify-between gap-3 p-2 rounded-md border bg-background hover:bg-muted/60 transition-colors"
                                >
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0 mt-0.5" />
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="top"
                                        className="max-w-xs"
                                      >
                                        <p className="font-mono text-xs">
                                          {perm.name}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>

                                    <Label
                                      htmlFor={perm.id}
                                      className="text-sm font-normal cursor-pointer leading-snug break-words"
                                    >
                                      {perm.description || perm.name}
                                    </Label>
                                  </div>

                                  <div className="flex-shrink-0 self-start mt-1">
                                    <Switch
                                      id={perm.id}
                                      checked={activeIds.has(perm.id)}
                                      onCheckedChange={(checked) =>
                                        handleToggle(perm.id, checked)
                                      }
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
