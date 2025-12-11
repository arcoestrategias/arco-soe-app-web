"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useModulesQuery,
  useModulePermissionsQuery,
  useSyncModulePermissionsMutation,
} from "../hooks/use-modules";
import { PermissionSelectionModal } from "./permission-selection-modal";
import type { Module, Permission } from "../types/types";

type ModalState = {
  open: boolean;
  moduleId: string | null;
  moduleName?: string;
};

export function ModulesDashboard() {
  const { data: modules, isLoading } = useModulesQuery();

  const [modal, setModal] = useState<ModalState>({
    open: false,
    moduleId: null,
  });

  const openPermsModal = (mod: Module) => {
    setModal({
      open: true,
      moduleId: mod.id,
      moduleName: mod.name,
    });
  };

  const closePermsModal = () => {
    setModal({ open: false, moduleId: null });
  };

  // Hook para obtener los permisos del módulo seleccionado en la modal
  const { data: currentModulePermissions, isLoading: isLoadingPermissions } =
    useModulePermissionsQuery(modal.moduleId);

  // Hook para la mutación (guardado) de permisos
  const syncMutation = useSyncModulePermissionsMutation();

  const handleSavePermissions = (updatedKeys: string[]) => {
    if (!modal.moduleId || !currentModulePermissions) return;

    // Construimos el payload para la API a partir de los permisos originales
    // y las claves de los permisos que el usuario dejó activos.
    const payloadPermissions = currentModulePermissions.map(
      (originalPerm: Permission) => {
        return {
          name: originalPerm.name,
          description: originalPerm.description,
          isActive: updatedKeys.includes(originalPerm.name),
        };
      }
    );

    syncMutation.mutate(
      {
        moduleId: modal.moduleId,
        payload: { permissions: payloadPermissions },
      },
      {
        onSuccess: () => {
          toast.success("Permisos del módulo actualizados correctamente.");
          closePermsModal();
        },
        onError: (error) => {
          toast.error(
            "Error al guardar los permisos: " + (error as Error).message
          );
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-md">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Módulos del Sistema</h1>
            {modules && (
              <span className="text-xs rounded-full px-2 py-1 bg-muted">
                {modules.length}
              </span>
            )}
          </div>
          {/* No hay botón de "Nuevo" ya que los módulos suelen estar definidos en el código */}
        </div>

        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">
            Cargando módulos…
          </div>
        ) : !modules || modules.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No se encontraron módulos.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left w-[250px]">
                    Nombre del Módulo
                  </th>
                  <th className="px-4 py-2 text-left w-[200px]">
                    Clave (shortCode)
                  </th>
                  <th className="px-4 py-2 text-left">Descripción</th>
                  <th className="px-4 py-2 text-center w-[150px]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((mod) => (
                  <tr key={mod.id} className="border-t">
                    <td className="px-4 py-3 font-medium w-[250px]">
                      {mod.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground w-[200px]">
                      {mod.shortCode}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {mod.description || (
                        <span className="italic">Sin descripción</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center w-[150px]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPermsModal(mod)}
                      >
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Ver Permisos
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.open && (
        <PermissionSelectionModal
          isOpen={modal.open}
          onClose={closePermsModal}
          onSave={handleSavePermissions}
          moduleName={modal.moduleName}
          // Pasamos la lista plana de permisos
          permissions={currentModulePermissions || []}
          activePermissionKeys={
            currentModulePermissions
              ?.filter((p) => p.isActive)
              .map((p) => p.name) || []
          }
          isSaving={syncMutation.isPending}
          isLoading={isLoadingPermissions}
        />
      )}
    </div>
  );
}
