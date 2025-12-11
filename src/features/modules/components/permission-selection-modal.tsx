"use client";

import { useState, useEffect, useMemo } from "react";
import { Info, Save, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface SelectablePermission {
  name: string;
  description: string | null;
}

interface PermissionSelectionModalProps {
  moduleName?: string;
  permissions: SelectablePermission[];
  activePermissionKeys: string[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPermissionKeys: string[]) => void;
  isSaving?: boolean;
  isLoading?: boolean;
}

export function PermissionSelectionModal({
  moduleName,
  permissions,
  activePermissionKeys,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
  isLoading = false,
}: PermissionSelectionModalProps) {
  // Estado local para la selección
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  // Serializamos las claves para evitar reinicios de estado por cambios de referencia en el array durante el guardado
  const activeKeysSerialized = JSON.stringify(activePermissionKeys);

  // Sincronizar estado cuando se abre la modal o cambian las props
  useEffect(() => {
    if (isOpen) {
      setSelectedKeys(new Set(activePermissionKeys));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeKeysSerialized]);

  // Reset de filtros cuando se cierra la modal
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  const handleToggle = (key: string, checked: boolean) => {
    const next = new Set(selectedKeys);
    if (checked) {
      next.add(key);
    } else {
      next.delete(key);
    }
    setSelectedKeys(next);
  };

  const handleSave = () => {
    onSave(Array.from(selectedKeys));
  };

  const allPermissionKeys = useMemo(
    () => permissions.map((p) => p.name),
    [permissions]
  );

  const totalPermissions = permissions.length;
  const totalActive = useMemo(
    () => permissions.filter((p) => selectedKeys.has(p.name)).length,
    [permissions, selectedKeys]
  );

  const allSelected =
    allPermissionKeys.length > 0 &&
    selectedKeys.size === allPermissionKeys.length;
  const someSelected = selectedKeys.size > 0 && !allSelected; // por si quieres usarlo en textos o estilos

  const handleSelectAllToggle = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedKeys(new Set(allPermissionKeys));
    } else {
      // Handles false and when user clicks an indeterminate state that becomes false
      setSelectedKeys(new Set());
    }
  };

  // Filtro de búsqueda
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredPermissions = useMemo(() => {
    if (!normalizedSearch) return permissions;

    return permissions.filter((p) => {
      const text = `${p.description || ""} ${p.name}`.toLowerCase();
      return text.includes(normalizedSearch);
    });
  }, [permissions, normalizedSearch]);

  const hasSearch = normalizedSearch.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-5xl w-[95vw] max-h-[80vh] overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Título + descripción */}
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            Gestionar permisos
            {moduleName && (
              <Badge variant="secondary" className="text-[11px]">
                {moduleName}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Activa o desactiva los permisos disponibles para este módulo.
          </DialogDescription>
        </DialogHeader>

        {/* TOOLBAR: buscador + resumen + acciones */}
        <div className="mb-4 mt-1 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Buscador */}
          <div className="flex-1 space-y-1">
            <Label htmlFor="perm-module-search" className="text-sm font-medium">
              Buscar permisos
            </Label>
            <Input
              id="perm-module-search"
              placeholder="Busca por descripción o código del permiso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Resumen */}
          <div className="md:text-center text-sm text-muted-foreground">
            Permisos activos:{" "}
            <span className="font-semibold text-foreground">{totalActive}</span>{" "}
            / {totalPermissions}
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {totalPermissions > 0 && !isLoading && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={allSelected}
                  onCheckedChange={handleSelectAllToggle}
                />
                <Label
                  htmlFor="select-all"
                  className="text-xs sm:text-sm cursor-pointer text-muted-foreground"
                >
                  Seleccionar todo
                </Label>
              </div>
            )}

            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving || isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || isLoading || totalPermissions === 0}
            >
              {isSaving ? (
                "Guardando..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar cambios
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Contenido principal */}
        <TooltipProvider delayDuration={200}>
          <div className="flex-1 py-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando permisos...
              </div>
            ) : totalPermissions === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay permisos configurables para este módulo.
              </div>
            ) : filteredPermissions.length === 0 && hasSearch ? (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron permisos que coincidan con la búsqueda.
              </div>
            ) : (
              <ScrollArea className="h-[380px] pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredPermissions.map((perm) => (
                    <div
                      key={perm.name}
                      className="flex justify-between gap-3 p-2 rounded-md border bg-background hover:bg-muted/60 transition-colors"
                    >
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0 mt-0.5" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="font-mono text-xs">{perm.name}</p>
                          </TooltipContent>
                        </Tooltip>

                        <Label
                          htmlFor={perm.name}
                          className="font-normal cursor-pointer text-sm leading-snug break-words"
                        >
                          {perm.description || perm.name}
                        </Label>
                      </div>

                      <div className="flex-shrink-0 self-start mt-1">
                        <Switch
                          id={perm.name}
                          checked={selectedKeys.has(perm.name)}
                          onCheckedChange={(checked) =>
                            handleToggle(perm.name, checked)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
