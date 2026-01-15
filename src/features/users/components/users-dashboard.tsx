"use client";

import { useState } from "react";
import { Plus, Eye, Pencil, Trash, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/shared/components/confirm-modal";
import { ImageUploader } from "@/shared/components/image-uploader";
import { getHumanErrorMessage } from "@/shared/api/response";
import { QKEY } from "@/shared/api/query-keys";

import type { UpdateUserPayload, User } from "../types/types";
import { useUsers } from "../hooks/use-users";
import { ModalUser, type ModalUserData } from "./modal-user";
import { patchUserBusinessUnit } from "../services/userBusinessUnitsService";
import { ModalUserPermissions } from "./modal-user-permissions";
import { getCompanyId } from "@/shared/auth/storage";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { usePermissions } from "@/shared/auth/access-control";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";

const fmtDate = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "medium",
  timeZone: "UTC",
});

type ModalState = {
  open: boolean;
  modo: "crear" | "ver" | "editar";
  user: ModalUserData | null;
  businessUnitId?: string;
};

type ConfirmState =
  | { open: false }
  | {
      open: true;
      kind: "update" | "inactivate";
      id?: string;
      payload?: UpdateUserPayload & {
        roleId?: string;
        companyId?: string;
        businessUnitId?: string; // BU destino
        previousBusinessUnitId?: string; // BU origen (del grupo/modal)
        positionId?: string | null;
        isResponsible?: boolean;
        // ⛔️ copyPermissions?: boolean; (eliminado)
        sendEmailConfirmation?: boolean;
        email?: string;
        firstName?: string;
      };
      title: string;
      message: string;
      confirmText?: string;
    };

function invalidateUsersCompanyList(qc: ReturnType<typeof useQueryClient>) {
  const companyId = getCompanyId() || "none";
  return qc.invalidateQueries({
    queryKey: QKEY.companyUsersGrouped(companyId),
  });
}

export function UsersDashboard() {
  const qc = useQueryClient();
  const { groups, total, isLoading, create, update, remove } = useUsers();

  // ✅ Permisos por módulo/acción
  const permissions = usePermissions({
    create: PERMISSIONS.USERS.CREATE,
    update: PERMISSIONS.USERS.UPDATE,
    delete: PERMISSIONS.USERS.DELETE,
    setRoles: PERMISSIONS.USERS.SET_ROLES,
    setPermissions: PERMISSIONS.USERS.SET_PERMISSIONS,
    setBusinessUnits: PERMISSIONS.USERS.SET_BUSINESS_UNITS,
  });

  const [modal, setModal] = useState<ModalState>({
    open: false,
    modo: "crear",
    user: null,
    businessUnitId: undefined,
  });
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });
  const [perm, setPerm] = useState<{
    open: boolean;
    user: User | null;
    businessUnitId?: string;
  }>({
    open: false,
    user: null,
    businessUnitId: undefined,
  });

  const openPerms = (u: User, businessUnitId: string) => {
    setPerm({ open: true, user: u, businessUnitId });
  };
  const closePerms = () =>
    setPerm({ open: false, user: null, businessUnitId: undefined });

  const openCreate = () =>
    setModal({
      open: true,
      modo: "crear",
      user: null,
      businessUnitId: undefined,
    });
  const openView = (u: User, businessUnitId: string) =>
    setModal({
      open: true,
      modo: "ver",
      user: u as ModalUserData,
      businessUnitId,
    });
  const openEdit = (u: User, businessUnitId: string) =>
    setModal({
      open: true,
      modo: "editar",
      user: u as ModalUserData,
      businessUnitId,
    });
  const closeModal = () =>
    setModal({
      open: false,
      modo: "crear",
      user: null,
      businessUnitId: undefined,
    });

  // CREATE payload (POST /users/assign)
  const toCreate = (p: any) => ({
    email: String(p.email || "").trim(),
    firstName: String(p.firstName || "").trim(),
    lastName: String(p.lastName || "").trim(),
    username: p.username?.trim() || undefined,
    ide: p.ide?.trim() || undefined,
    telephone: p.telephone?.trim() || undefined,
    password: String(p.password || "").trim(),
    roleId: p.roleId,
    businessUnitId: p.businessUnitId,
  });

  // UPDATE payload (PATCH /users/:id)
  const toUpdate = (p: any): UpdateUserPayload & any => ({
    email: p.email?.trim() || undefined,
    firstName: p.firstName?.trim() || undefined,
    lastName: p.lastName?.trim() || undefined,
    username: p.username?.trim() || undefined,
    ide: p.ide?.trim() || undefined,
    telephone: p.telephone?.trim() || undefined,
    isActive: p.isActive,
    roleId: p.roleId,
    companyId: p.companyId,
    businessUnitId: p.businessUnitId,
    isResponsible: !!p.isResponsible,
    // ⛔️ copyPermissions: p.copyPermissions !== false,
    sendEmailConfirmation: !!p.sendEmailConfirmation,
  });

  const handleSaveFromModal = (res: {
    mode: "crear" | "editar";
    id?: string;
    payload: any;
  }) => {
    if (res.mode === "crear") {
      // El payload ya viene con email, firstName, lastName, username?, roleId, businessUnitId y password
      create(
        res.payload as any,
        {
          onSuccess: async () => {
            await invalidateUsersCompanyList(qc);
            closeModal();
          },
        } as any
      );
      return;
    }

    // EDITAR → confirmación (agregamos previousBusinessUnitId para detectar MOVE)
    setConfirm({
      open: true,
      kind: "update",
      id: res.id,
      payload: {
        ...res.payload,
        previousBusinessUnitId: res.payload.addToAnotherBU
          ? undefined
          : modal.businessUnitId ?? undefined,
      },
      title: "Guardar cambios",
      message: "¿Deseas guardar los cambios del usuario?",
      confirmText: "Guardar",
    });
  };

  const askInactivate = (u: User) =>
    setConfirm({
      open: true,
      kind: "inactivate",
      id: u.id,
      title: "Inactivar usuario",
      message: `¿Seguro que deseas inactivar “${u.firstName} ${u.lastName}”?`,
      confirmText: "Inactivar",
    });

  const handleConfirm = () => {
    if (!confirm.open) return;

    if (confirm.kind === "update" && confirm.id && confirm.payload) {
      const {
        roleId,
        businessUnitId, // BU destino (del form)
        previousBusinessUnitId, // BU origen (del grupo/modal)
        positionId,
        isResponsible = false,
        sendEmailConfirmation: sendConfirmFlag = false,
        companyId, // solo UI
        ...patchUser
      } = confirm.payload;

      // 1) PATCH user (perfil)
      update({ id: confirm.id, data: patchUser }, {
        onSuccess: async () => {
          try {
            // 2) Vínculo por BU: mover o actualizar según cambio de BU
            if (
              businessUnitId &&
              (roleId ||
                positionId !== undefined ||
                typeof isResponsible === "boolean")
            ) {
              if (
                previousBusinessUnitId &&
                previousBusinessUnitId !== businessUnitId
              ) {
                // === MOVER de previousBusinessUnitId -> businessUnitId ===
                await patchUserBusinessUnit(confirm.id!, businessUnitId, {
                  fromBusinessUnitId: previousBusinessUnitId,
                  roleId,
                  isResponsible,
                  // positionId: si luego agregas selector de posición en el modal, envíalo aquí
                });
              } else {
                // === ACTUALIZAR en la misma BU ===
                await patchUserBusinessUnit(confirm.id!, businessUnitId, {
                  roleId,
                  positionId: positionId ?? undefined, // undefined: no tocar; null: desasignar; string: asignar
                  isResponsible,
                });
              }
            }

            // 3) Invalidar la lista agrupada por compañía
            await invalidateUsersCompanyList(qc);

            toast.success("Usuario actualizado");
            setConfirm({ open: false });
            closeModal();
          } catch (e: any) {
            toast.error(getHumanErrorMessage(e));
            setConfirm({ open: false });
          }
        },
        onError: (e: any) => {
          toast.error(getHumanErrorMessage(e));
          setConfirm({ open: false });
        },
      } as any);
      return;
    }

    if (confirm.kind === "inactivate" && confirm.id) {
      remove(confirm.id, {
        onSuccess: async () => {
          await invalidateUsersCompanyList(qc);
          toast.success("Usuario inactivado");
          setConfirm({ open: false });
        },
        onError: (e: any) => {
          toast.error(getHumanErrorMessage(e));
          setConfirm({ open: false });
        },
      } as any);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-md">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Gestión de Usuarios</h1>
            <span className="text-xs rounded-full px-2 py-1 bg-muted">
              {total}
            </span>
          </div>
          {permissions.create && (
            <Button onClick={openCreate} size="sm" className="h-8 btn-gradient">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">
            Cargando usuarios…
          </div>
        ) : groups.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No hay usuarios para la compañía seleccionada.
          </div>
        ) : (
          <Accordion type="multiple" className="w-full">
            {groups.map((g) => (
              <AccordionItem key={g.businessUnitId} value={g.businessUnitId}>
                <AccordionTrigger className="px-4 py-3 bg-muted/40 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{g.businessUnitName}</span>
                    <Badge variant="secondary">{g.users.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-2 text-center w-[50px]">
                            Avatar
                          </th>
                          <th className="px-4 py-2 text-left w-[250px]">
                            Usuario
                          </th>
                          <th className="px-4 py-2 text-left w-[250px]">
                            Correo
                          </th>
                          {permissions.setRoles && (
                            <th className="px-4 py-2 text-center w-[180px]">
                              Rol
                            </th>
                          )}
                          <th className="px-4 py-2 text-center w-[230px]">
                            Posición
                          </th>
                          <th className="px-4 py-2 text-center w-[180px]">
                            Email confirmado
                          </th>
                          <th className="px-4 py-2 text-center w-[180px]">
                            Último acceso
                          </th>
                          <th className="px-4 py-2 text-center w-[180px]">
                            Estado
                          </th>
                          <th className="px-4 py-2 text-center w-[250px]">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.users.map((u) => (
                          <tr key={u.id} className="border-t">
                            <td className="px-4 py-2 w-[50px]">
                              <ImageUploader
                                referenceId={u.id}
                                name={`${u.firstName} ${u.lastName}`}
                                size={40}
                              />
                            </td>

                            <td className="px-4 py-2 font-medium w-[250px]">
                              <div>{`${u.firstName} ${u.lastName}`}</div>
                              <div className="text-xs text-muted-foreground">
                                Creado: {fmtDate.format(new Date(u.createdAt))}
                              </div>
                            </td>

                            <td className="px-4 py-2 w-[250px]">{u.email}</td>

                            {/* Rol */}
                            {permissions.setRoles && (
                              <td className="px-4 py-2 text-center">
                                {u.roleName ? (
                                  <span>{u.roleName}</span>
                                ) : (
                                  <Badge className="bg-red-500 text-white">
                                    Sin Rol
                                  </Badge>
                                )}
                              </td>
                            )}

                            {/* Posición */}
                            <td className="px-4 py-2 text-center w-[230px]">
                              {u.positionName ? (
                                <span>{u.positionName}</span>
                              ) : (
                                <Badge className="bg-red-500 text-white">
                                  Sin Posición
                                </Badge>
                              )}
                            </td>

                            {/* Email confirmado */}
                            <td className="px-4 py-2 text-center w-[180px]">
                              <Badge
                                className={
                                  u.isEmailConfirmed
                                    ? "bg-green-500 text-white"
                                    : "bg-red-500 text-white"
                                }
                              >
                                {u.isEmailConfirmed
                                  ? "Confirmado"
                                  : "No confirmado"}
                              </Badge>
                            </td>

                            {/* Último acceso */}
                            <td className="px-4 py-2 text-center w-[180px]">
                              {u.lastLoginAt ? (
                                fmtDate.format(new Date(u.lastLoginAt))
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>

                            {/* Estado */}
                            <td className="px-4 py-2 text-center w-[180px]">
                              <Badge
                                className={
                                  u.isActive
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-300 text-gray-800"
                                }
                              >
                                {u.isActive ? "Activo" : "Inactivo"}
                              </Badge>
                            </td>

                            {/* Acciones */}
                            <td className="px-4 py-2 flex flex-wrap gap-2 justify-center w-[250px]">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openView(u, g.businessUnitId)}
                                title="Ver"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {/* Oculto si no hay permiso */}
                              {permissions.setPermissions && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => openPerms(u, g.businessUnitId)}
                                  title="Permisos (unidad)"
                                  disabled={!g.businessUnitId}
                                >
                                  <ShieldCheck className="h-4 w-4" />
                                </Button>
                              )}
                              {permissions.update && (
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  onClick={() => openEdit(u, g.businessUnitId)}
                                  title="Editar"
                                  className="btn-gradient"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {permissions.delete && (
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => askInactivate(u)}
                                  title="Inactivar"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Modal Ver / Crear / Editar */}
      <ModalUser
        isOpen={modal.open}
        modo={modal.modo}
        user={modal.user}
        onClose={closeModal}
        onSave={handleSaveFromModal}
        businessUnitId={modal.businessUnitId ?? ""}
        canSetRoles={permissions.setRoles}
        canSetBusinessUnits={permissions.setBusinessUnits}
      />

      {/* Confirmación (editar / inactivar) */}
      <ConfirmModal
        open={confirm.open}
        title={confirm.open ? confirm.title : ""}
        message={confirm.open ? confirm.message : ""}
        confirmText={confirm.open ? confirm.confirmText : undefined}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm({ open: false })}
      />

      {/* Permisos (usa businessUnitId del grupo) */}
      <ModalUserPermissions
        isOpen={perm.open}
        onClose={closePerms}
        userId={perm.user?.id ?? ""}
        businessUnitId={perm.businessUnitId ?? ""}
        userName={
          perm.user ? `${perm.user.firstName} ${perm.user.lastName}` : undefined
        }
      />
    </div>
  );
}
