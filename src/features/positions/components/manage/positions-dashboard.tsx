"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Trash } from "lucide-react";

import { QKEY } from "@/shared/api/query-keys";
import { getHumanErrorMessage } from "@/shared/api/response";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/shared/components/confirm-modal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { getCompanyId } from "@/shared/auth/storage";
import { getPositionsByCompanyGrouped } from "@/features/positions/services/positionsService";
import { usePositions } from "@/features/positions/hooks/use-positions";
import { ModalPosition } from "./modal-position";
import type { Position } from "@/features/positions/types/positions";
import { type PositionsByCompanyGroupBU } from "../../types/positions";
import { patchUserBusinessUnit } from "@/features/users/services/userBusinessUnitsService";
import { usePermissions } from "@/shared/auth/access-control";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";

export function PositionsDashboard() {
  const qc = useQueryClient();
  // Estado modal / confirma (igual que antes)
  const [openModal, setOpenModal] = useState(false);
  const [modo, setModo] = useState<"crear" | "editar" | "ver">("crear");
  const [current, setCurrent] = useState<Position | null>(null);
  const [openConfirm, setOpenConfirm] = useState(false);

  const permissions = usePermissions({
    create: PERMISSIONS.POSITIONS.CREATE,
    update: PERMISSIONS.POSITIONS.UPDATE,
    delete: PERMISSIONS.POSITIONS.DELETE,
    setBusinessUnits: PERMISSIONS.POSITIONS.SET_BUSINESS_UNITS,
    setUsers: PERMISSIONS.POSITIONS.SET_USERS,
    setParentPosition: PERMISSIONS.POSITIONS.SET_PARENT_POSITION,
  });

  const { fullCreatePosition, updatePosition, inactivatePosition } =
    usePositions();

  // ⚠️ Nuevo: leemos companyId del storage y usamos el endpoint agrupado
  const companyId = getCompanyId() ?? "";

  const {
    data = [],
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: QKEY.companyPositionsGrouped(companyId || "none"),
    queryFn: () =>
      companyId ? getPositionsByCompanyGrouped(companyId) : Promise.resolve([]),
    enabled: !!companyId,
    staleTime: 60_000,
  });

  const groups = useMemo<PositionsByCompanyGroupBU[]>(
    () => (Array.isArray(data) ? data : []),
    [data],
  );

  const total = useMemo(
    () => groups.reduce((acc, g) => acc + (g.positions?.length ?? 0), 0),
    [groups],
  );

  // Handlers
  const openCreate = () => {
    setModo("crear");
    setCurrent(null);
    setOpenModal(true);
  };
  const openEdit = (pos: Position) => {
    setModo("editar");
    setCurrent(pos);
    setOpenModal(true);
  };
  const openView = (pos: Position) => {
    setModo("ver");
    setCurrent(pos);
    setOpenModal(true);
  };
  const askInactivate = (pos: Position) => {
    setCurrent(pos);
    setOpenConfirm(true);
  };
  const handleInactivate = () => {
    if (!current?.id) return;
    inactivatePosition.mutate(current.id, {
      onSuccess: () => {
        setOpenConfirm(false);
        refetch();
      },
    });
  };
  const handleSave = (res: {
    mode: "crear" | "editar";
    id?: string;
    payload: any;
  }) => {
    if (res.mode === "crear") {
      // 1) crea la posición
      fullCreatePosition.mutate(res.payload, {
        onSuccess: async (created: Position) => {
          try {
            // 2) asigna usuario a la posición si vino userId (no vacío)
            if (res.payload.userId && res.payload.userId !== "") {
              await patchUserBusinessUnit(
                res.payload.userId,
                res.payload.businessUnitId,
                { positionId: created.id },
              );
            }
          } finally {
            await qc.invalidateQueries({
              queryKey: QKEY.businessUnitUsersNoPosition(
                res.payload.businessUnitId,
              ),
            });
            setOpenModal(false);
            refetch();
          }
        },
      });
    } else if (res.mode === "editar" && res.id) {
      // 1) actualiza datos propios de la posición (name, isCeo,...)
      const { userId, ...positionData } = res.payload;
      updatePosition.mutate(
        { id: res.id, data: positionData },
        {
          onSuccess: async () => {
            try {
              // 2) asigna o desasigna según userId
              if (userId === "") {
                // desasignar
                await patchUserBusinessUnit(
                  // necesitas un userId para desasignar si está ocupada por alguien:
                  // si no lo tienes en el DTO, puedes omitir desasignar aquí
                  // y exponer desasignación solo cuando eliges "Sin usuario" junto con un usuario seleccionado.
                  // Si EN TU API el backend permite desasignar sin userId (por positionId), ignora este comentario.
                  // Asumiendo tu endpoint requiere userId, entonces:
                  current?.userId!, // usuario actual en esa posición
                  positionData.businessUnitId,
                  { positionId: null }, // desasignar
                );
              } else if (userId) {
                await patchUserBusinessUnit(
                  userId,
                  positionData.businessUnitId,
                  { positionId: res.id }, // asignar
                );
              }
            } finally {
              await qc.invalidateQueries({
                queryKey: QKEY.businessUnitUsersNoPosition(
                  positionData.businessUnitId,
                ),
              });
              setOpenModal(false);
              refetch();
            }
          },
        },
      );
    }
  };

  if (error) {
    return (
      <div className="text-sm text-red-600">
        {getHumanErrorMessage(error as any)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-md">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Gestión de Posiciones</h1>
            <span className="text-xs rounded-full px-2 py-1 bg-muted">
              {total}
            </span>
          </div>
          {permissions.create && (
            <Button onClick={openCreate} size="sm" className="h-8 btn-gradient">
              Nueva Posición
            </Button>
          )}
        </div>

        {isPending ? (
          <div className="p-4 text-sm text-muted-foreground">
            Cargando posiciones…
          </div>
        ) : groups.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No hay posiciones para la compañía seleccionada.
          </div>
        ) : (
          <Accordion type="multiple" className="w-full">
            {groups.map((g) => (
              <AccordionItem key={g.businessUnitId} value={g.businessUnitId}>
                <AccordionTrigger className="px-4 py-3 bg-muted/40 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{g.businessUnitName}</span>
                    <Badge variant="secondary">{g.positions.length}</Badge>
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-2 text-left">Posición</th>
                          <th className="px-4 py-2 text-left">
                            Usuario asignado
                          </th>
                          <th className="px-4 py-2 text-center">CEO</th>
                          <th className="px-4 py-2 text-center">Estado</th>
                          <th className="px-4 py-2 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.positions.map((p) => (
                          <tr key={p.id} className="border-t">
                            <td className="px-4 py-2">{p.name}</td>
                            <td className="px-4 py-2">
                              {p.userFullName ? (
                                p.userFullName
                              ) : (
                                <Badge className="bg-red-500 text-white hover:bg-red-600">
                                  Sin usuario
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Badge
                                className={
                                  p.isCeo
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-300 text-gray-800"
                                }
                              >
                                {p.isCeo ? "Sí" : "No"}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Badge
                                className={
                                  p.isActive
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-300 text-gray-800"
                                }
                              >
                                {p.isActive ? "Activa" : "Inactiva"}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 flex flex-wrap gap-2 justify-center">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openView(p)}
                                title="Ver"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {permissions.update && (
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  onClick={() => openEdit(p)}
                                  title="Editar"
                                  className="btn-gradient"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {p.isActive && permissions.delete && (
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => askInactivate(p)}
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

      {/* Modal crear/editar/ver (igual que tu versión actual) */}
      <ModalPosition
        isOpen={openModal}
        modo={modo}
        position={current}
        onClose={() => setOpenModal(false)}
        onSave={handleSave}
        canSetBusinessUnits={permissions.setBusinessUnits}
        canSetUsers={permissions.setUsers}
        canSetParentPosition={permissions.setParentPosition}
      />

      {/* Confirm inactivar */}
      <ConfirmModal
        open={openConfirm}
        title="Inactivar posición"
        message={`¿Deseas inactivar la posición "${current?.name}"?`}
        confirmText="Inactivar"
        onConfirm={handleInactivate}
        onCancel={() => setOpenConfirm(false)}
      />
    </div>
  );
}
