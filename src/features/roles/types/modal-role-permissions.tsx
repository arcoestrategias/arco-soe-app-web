"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Loader2, Save, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";

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

  // Guardamos los IDs activos en un Set para acceso rápido
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());

  // Sincronizar estado cuando cargan los permisos
  useEffect(() => {
    if (permissions) {
      const active = new Set(
        permissions.filter((p) => p.isActive).map((p) => p.id)
      );
      setActiveIds(active);
    }
  }, [permissions, isOpen]);

  const handleToggle = (id: string, checked: boolean) => {
    const next = new Set(activeIds);
    if (checked) next.add(id);
    else next.delete(id);
    setActiveIds(next);
  };

  const handleSave = () => {
    if (!roleId || !permissions) return;

    // Construimos el payload con TODOS los permisos y su estado final
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

  // Agrupar permisos por módulo
  const groupedPermissions = useMemo(() => {
    if (!permissions) return {};
    return permissions.reduce((acc, p) => {
      const mod = p.module || "General";
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(p);
      return acc;
    }, {} as Record<string, RolePermission[]>);
  }, [permissions]);

  const sortedModules = useMemo(
    () => Object.keys(groupedPermissions).sort(),
    [groupedPermissions]
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Permisos del Rol: {roleName}</DialogTitle>
          <DialogDescription>
            Activa o desactiva los permisos para este rol.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !permissions || permissions.length === 0 ? (
            <div className="text-center text-muted-foreground p-4">
              No hay permisos disponibles.
            </div>
          ) : (
            <ScrollArea className="h-full pr-4">
              <Accordion
                type="multiple"
                className="w-full"
                defaultValue={sortedModules}
              >
                {sortedModules.map((moduleName) => (
                  <AccordionItem value={moduleName} key={moduleName}>
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{moduleName}</span>
                        <Badge variant="secondary" className="text-xs">
                          {groupedPermissions[moduleName].length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pl-1 pt-1 pb-2">
                        {groupedPermissions[moduleName].map((perm) => (
                          <div
                            key={perm.id}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 border"
                          >
                            <div className="flex flex-col gap-0.5">
                              <Label
                                htmlFor={perm.id}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {perm.name}
                              </Label>
                              {perm.description && (
                                <span className="text-xs text-muted-foreground">
                                  {perm.description}
                                </span>
                              )}
                            </div>
                            <Switch
                              id={perm.id}
                              checked={activeIds.has(perm.id)}
                              onCheckedChange={(checked) =>
                                handleToggle(perm.id, checked)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || isLoading}
          >
            {updateMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {!updateMutation.isPending && <Save className="w-4 h-4 mr-2" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
