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
import { ModalUser } from "./modal-user";

// extra services (2do y 3er endpoint en editar)
import { assignUserToBusinessUnit } from "@/features/users/services/usersAssignService";
import { sendNotification } from "@/features/notifications/services/notificationsService";
import { patchUserBusinessUnit } from "../services/userBusinessUnitsService";
import { ModalUserPermissions } from "./modal-user-permissions";

const fmtDate = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "medium",
  timeZone: "UTC",
});

type ModalState = {
  open: boolean;
  modo: "crear" | "ver" | "editar";
  user:
    | (User & {
        roleId?: string;
        businessUnitId?: string;
        isEmailConfirmed?: boolean;
      })
    | null;
};

type ConfirmState =
  | { open: false }
  | {
      open: true;
      kind: "update" | "inactivate";
      id?: string;
      payload?: UpdateUserPayload & {
        // asegurar lo que usamos luego:
        roleId?: string;
        companyId?: string;
        businessUnitId?: string;
        positionId?: string | null; // ✅ AÑADIR
        isResponsible?: boolean;
        copyPermissions?: boolean;
        sendEmailConfirmation?: boolean;
        email?: string;
        firstName?: string;
      };
      title: string;
      message: string;
      confirmText?: string;
    };

function pickPrimaryLink(u?: any) {
  const links = u?.userBusinessUnits ?? [];
  if (!links || !links.length) return undefined;
  return links.find((l: any) => l.isResponsible) ?? links[0];
}

export function UsersDashboard() {
  const qc = useQueryClient();
  const { users = [], isLoading, create, update, remove } = useUsers();

  const [modal, setModal] = useState<ModalState>({
    open: false,
    modo: "crear",
    user: null,
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

  const openPerms = (u: User) => {
    const link = pickPrimaryLink(u);
    if (!link) return; // si no tiene BU asignadas, no abrimos
    setPerm({ open: true, user: u, businessUnitId: link.businessUnitId });
  };

  const closePerms = () =>
    setPerm({ open: false, user: null, businessUnitId: undefined });

  const openCreate = () => setModal({ open: true, modo: "crear", user: null });
  const openView = (u: User) =>
    setModal({ open: true, modo: "ver", user: u as any });
  const openEdit = (u: User) =>
    setModal({ open: true, modo: "editar", user: u as any });
  const closeModal = () => setModal({ open: false, modo: "crear", user: null });

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

  // UPDATE payload (PATCH /users con id en body)
  const toUpdate = (p: any): UpdateUserPayload & any => ({
    email: p.email?.trim() || undefined,
    firstName: p.firstName?.trim() || undefined,
    lastName: p.lastName?.trim() || undefined,
    username: p.username?.trim() || undefined,
    ide: p.ide?.trim() || undefined,
    telephone: p.telephone?.trim() || undefined,
    isActive: p.isActive,

    // extras para el flujo de editar (2do/3er endpoint)
    roleId: p.roleId,
    companyId: p.companyId,
    businessUnitId: p.businessUnitId,
    isResponsible: !!p.isResponsible,
    copyPermissions: p.copyPermissions !== false,
    sendEmailConfirmation: !!p.sendEmailConfirmation,
  });

  // Handler unificado desde la modal
  const handleSaveFromModal = (res: {
    mode: "crear" | "editar";
    id?: string;
    payload: any;
  }) => {
    if (res.mode === "crear") {
      create(toCreate(res.payload) as any, { onSuccess: closeModal } as any);
      return;
    }
    setConfirm({
      open: true,
      kind: "update",
      id: res.id,
      payload: toUpdate(res.payload),
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
        businessUnitId, // string | undefined
        positionId, // string | null | undefined
        isResponsible = false,
        copyPermissions = true,
        sendEmailConfirmation = false,
        companyId, // solo UI
        ...patchUser
      } = confirm.payload;

      // 1) PATCH user
      update({ id: confirm.id, data: patchUser }, {
        onSuccess: async () => {
          try {
            const currentUser = users.find((u) => u.id === confirm.id);
            const links = currentUser?.userBusinessUnits ?? [];
            const primary = links.find((l: any) => l.isResponsible) ?? links[0];
            const origBU: string | undefined = primary?.businessUnitId;

            // 2) Vínculo (rol/position/isResponsible)
            // -- Si cambiaron de BU y la nueva existe, patch; si no existe, assign.
            if (
              roleId ||
              positionId !== undefined ||
              typeof isResponsible === "boolean"
            ) {
              if (businessUnitId && origBU && businessUnitId !== origBU) {
                // Cambió de BU
                const existing = links.find(
                  (l: any) => l.businessUnitId === businessUnitId
                );

                if (existing) {
                  // ✅ businessUnitId es string, ok
                  await patchUserBusinessUnit(confirm.id!, businessUnitId, {
                    roleId,
                    positionId: positionId ?? undefined,
                    isResponsible,
                  });
                } else {
                  // crear vínculo
                  if (roleId && businessUnitId) {
                    await assignUserToBusinessUnit({
                      userId: confirm.id!,
                      businessUnitId,
                      roleId,
                      isResponsible,
                      copyPermissions,
                    });
                    // opcional: si además quieres setear positionId después de crear:
                    if (positionId !== undefined) {
                      await patchUserBusinessUnit(confirm.id!, businessUnitId, {
                        positionId,
                      });
                    }
                  }
                }
              } else {
                // Misma BU (o no cambió): usa BU “efectiva”
                const buToPatch: string | undefined = businessUnitId ?? origBU;
                if (buToPatch) {
                  await patchUserBusinessUnit(confirm.id!, buToPatch, {
                    roleId,
                    positionId: positionId ?? undefined,
                    isResponsible,
                  });
                }
                // Si no hay buToPatch, no tocamos vínculo (no hay link)
              }
            }

            // 3) (opcional) confirmación de email
            if (sendEmailConfirmation) {
              const toEmail = patchUser.email ?? currentUser?.email ?? "";
              if (toEmail) {
                const origin =
                  typeof window !== "undefined"
                    ? window.location.origin
                    : "http://localhost:3000";
                await sendNotification({
                  codeTemplate: "T01",
                  to: toEmail,
                  variables: {
                    firstname:
                      patchUser.firstName ?? currentUser?.firstName ?? "",
                    url: `${origin}/auth/confirm?ref=mail`,
                    contact: `${origin}/help-me`,
                  },
                });
              }
            }

            await qc.invalidateQueries({ queryKey: QKEY.users });
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

    // ... inactivate igual que ya lo tenías
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-md">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Gestión de Usuarios</h1>
            <span className="text-xs rounded-full px-2 py-1 bg-muted">
              {users.length}
            </span>
          </div>
          <Button onClick={openCreate} size="sm" className="h-8 btn-gradient">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>

        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">
            Cargando usuarios…
          </div>
        ) : users.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No hay usuarios registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-left">Avatar</th>
                  <th className="px-4 py-2 text-left">Usuario</th>
                  <th className="px-4 py-2 text-left">Correo</th>
                  <th className="px-4 py-2 text-left">Identificación</th>
                  <th className="px-4 py-2 text-left">Teléfono</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                  <th className="px-4 py-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-4 py-2">
                      <ImageUploader
                        referenceId={u.id}
                        name={`${u.firstName} ${u.lastName}`}
                        size={40}
                      />
                    </td>
                    <td className="px-4 py-2 font-medium">
                      <div>{`${u.firstName} ${u.lastName}`}</div>
                      <div className="text-xs text-muted-foreground">
                        Creado: {fmtDate.format(new Date(u.createdAt))}
                      </div>
                    </td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">{u.ide ?? ""}</td>
                    <td className="px-4 py-2">{u.telephone ?? ""}</td>
                    <td className="px-4 py-2">
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
                    <td className="px-4 py-2 flex flex-wrap gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openView(u)}
                        title="Ver"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openPerms(u)}
                        title="Permisos (unidad actual)"
                        disabled={
                          !u.userBusinessUnits ||
                          u.userBusinessUnits.length === 0
                        }
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => openEdit(u)}
                        title="Editar"
                        className="btn-gradient"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => askInactivate(u)}
                        title="Inactivar"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Ver / Crear / Editar */}
      <ModalUser
        isOpen={modal.open}
        modo={modal.modo}
        user={modal.user}
        onClose={closeModal}
        onSave={handleSaveFromModal}
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
