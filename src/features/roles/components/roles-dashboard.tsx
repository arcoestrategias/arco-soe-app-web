"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash, ShieldCheck, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useModulesQuery } from "@/features/modules/hooks/use-modules";
import {
  useRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useInactivateRoleMutation,
  useReactivateRoleMutation,
} from "../hooks/use-roles";
import { ConfirmModal } from "@/shared/components/confirm-modal";
import { getHumanErrorMessage } from "@/shared/api/response";
import type { Role } from "../types/types";
import { ModalRolePermissions } from "./modal-role-permissions";
import { ModalRole, type RoleFormData } from "./modal-role";
import { usePermissions } from "@/shared/auth/access-control";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";

type PermsModalState = {
  open: boolean;
  role: Role | null;
};

type CrudModalState = {
  open: boolean;
  modo: "crear" | "editar";
  role: Role | null;
};

type ConfirmDeleteState = { open: false } | { open: true; role: Role };

export function RolesDashboard() {
  const [includeInactive, setIncludeInactive] = useState(false);
  // Queries
  const {
    data: roles,
    isLoading,
    isError,
  } = useRolesQuery({ includeInactive });
  const createMutation = useCreateRoleMutation();
  const updateMutation = useUpdateRoleMutation();
  const inactivateMutation = useInactivateRoleMutation();
  const reactivateMutation = useReactivateRoleMutation();

  const permissions = usePermissions({
    create: PERMISSIONS.ROLES.CREATE,
    update: PERMISSIONS.ROLES.UPDATE,
    delete: PERMISSIONS.ROLES.DELETE,
    setPermissions: PERMISSIONS.ROLES.SET_PERMISSIONS,
  });

  const [permsModal, setPermsModal] = useState<PermsModalState>({
    open: false,
    role: null,
  });

  const [crudModal, setCrudModal] = useState<CrudModalState>({
    open: false,
    modo: "crear",
    role: null,
  });

  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState>({
    open: false,
  });

  const openPermsModal = (role: Role) => setPermsModal({ open: true, role });
  const closePermsModal = () => setPermsModal({ open: false, role: null });

  const openCreateModal = () =>
    setCrudModal({ open: true, modo: "crear", role: null });
  const openEditModal = (role: Role) =>
    setCrudModal({ open: true, modo: "editar", role });
  const closeCrudModal = () =>
    setCrudModal({ open: false, modo: "crear", role: null });

  const handleSaveFromModal = (data: {
    mode: "crear" | "editar";
    id?: string;
    payload: RoleFormData;
  }) => {
    if (data.mode === "crear") {
      createMutation.mutate(data.payload, {
        onSuccess: () => {
          toast.success("Rol creado correctamente.");
          closeCrudModal();
        },
        onError: (error) =>
          toast.error(`Error al crear el rol: ${getHumanErrorMessage(error)}`),
      });
    } else if (data.mode === "editar" && data.id) {
      updateMutation.mutate(
        { id: data.id, payload: data.payload },
        {
          onSuccess: () => {
            toast.success("Rol actualizado correctamente.");
            closeCrudModal();
          },
          onError: (error) =>
            toast.error(
              `Error al actualizar el rol: ${getHumanErrorMessage(error)}`
            ),
        }
      );
    }
  };

  const askDelete = (role: Role) => setConfirmDelete({ open: true, role });

  const handleDelete = () => {
    if (!confirmDelete.open) return;
    inactivateMutation.mutate(confirmDelete.role.id, {
      onSuccess: () => {
        toast.success(`Rol "${confirmDelete.role.name}" inactivado.`);
        setConfirmDelete({ open: false });
      },
      onError: (error) =>
        toast.error(`Error al inactivar: ${getHumanErrorMessage(error)}`),
    });
  };

  const handleReactivate = (role: Role) => {
    reactivateMutation.mutate(role.id, {
      onSuccess: () => {
        toast.success(`Rol "${role.name}" reactivado correctamente.`);
      },
      onError: (error) => {
        toast.error(`Error al reactivar: ${getHumanErrorMessage(error)}`);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-md">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Gestión de Roles</h1>
            {roles && (
              <span className="text-xs rounded-full px-2 py-1 bg-muted">
                {roles.length}
              </span>
            )}
            <div className="border-l pl-4 ml-4 flex items-center gap-2">
              <Checkbox
                id="include-inactive"
                checked={includeInactive}
                onCheckedChange={(checked) => setIncludeInactive(!!checked)}
              />
              <Label htmlFor="include-inactive" className="text-sm font-normal">
                Incluir inactivos
              </Label>
            </div>
          </div>
          {permissions.create && (
            <Button
              onClick={openCreateModal}
              size="sm"
              className="h-8 btn-gradient"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Rol
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">
            Cargando roles…
          </div>
        ) : isError ? (
          <div className="p-4 text-sm text-red-600">
            Ocurrió un error al cargar los roles.
          </div>
        ) : !roles || roles.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No se encontraron roles.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left w-[250px]">
                    Nombre del Rol
                  </th>
                  <th className="px-4 py-2 text-left">Descripción</th>
                  <th className="px-4 py-2 text-center w-[150px]">
                    Por Defecto
                  </th>
                  <th className="px-4 py-2 text-center w-[120px]">Estado</th>
                  <th className="px-4 py-2 text-center w-[250px]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roles?.map((role) => (
                  <tr key={role.id} className="border-t">
                    <td className="px-4 py-3 font-medium w-[250px]">
                      {role.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {role.description || (
                        <span className="italic">Sin descripción</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center w-[150px]">
                      {role.isDefault ? (
                        <Badge className="bg-blue-100 text-blue-800">Sí</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center w-[120px]">
                      <Badge
                        className={
                          role.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {role.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 flex flex-wrap gap-2 justify-center w-[250px]">
                      {role.isActive ? (
                        <>
                          {permissions.setPermissions && (
                            <Button
                              variant="outline"
                              size="icon"
                              title="Permisos del Rol"
                              onClick={() => openPermsModal(role)}
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </Button>
                          )}
                          {permissions.update && (
                            <Button
                              variant="secondary"
                              size="icon"
                              title="Editar"
                              className="btn-gradient"
                              onClick={() => openEditModal(role)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {permissions.delete && (
                            <Button
                              variant="destructive"
                              size="icon"
                              title="Inactivar"
                              disabled={role.isDefault}
                              onClick={() => askDelete(role)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      ) : permissions.update ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReactivate(role)}
                          disabled={reactivateMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reactivar
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ModalRolePermissions
        isOpen={permsModal.open}
        onClose={closePermsModal}
        roleId={permsModal.role?.id ?? null}
        roleName={permsModal.role?.name}
      />

      <ModalRole
        isOpen={crudModal.open}
        onClose={closeCrudModal}
        onSave={handleSaveFromModal}
        modo={crudModal.modo}
        role={crudModal.role}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmModal
        open={confirmDelete.open}
        title="Confirmar Inactivación"
        message={`¿Estás seguro de que deseas inactivar el rol "${
          confirmDelete.open ? confirmDelete.role.name : ""
        }"? El rol podrá ser reactivado más tarde.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ open: false })}
        isDestructive
      />
    </div>
  );
}
