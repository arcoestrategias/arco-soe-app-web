// src/features/positions/components/positions-dashboard.tsx
"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import { getPositions } from "../../services/positionsService";
import { getHumanErrorMessage } from "@/shared/api/response";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/shared/components/confirm-modal";
import { ModalPosition } from "./modal-position";
import { usePositions } from "../../hooks/use-positions";
import type { Position } from "../../types/positions";
import { Eye, Pencil, Trash } from "lucide-react";

export function PositionsDashboard() {
  const [openModal, setOpenModal] = useState(false);
  const [modo, setModo] = useState<"crear" | "editar" | "ver">("crear");
  const [current, setCurrent] = useState<Position | null>(null);
  const [openConfirm, setOpenConfirm] = useState(false);

  const {
    data = [],
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: QKEY.positions,
    queryFn: getPositions,
    staleTime: 60_000,
  });

  const { fullCreatePosition, updatePosition, inactivatePosition } =
    usePositions();

  const positions = useMemo<Position[]>(
    () => (Array.isArray(data) ? data : []),
    [data]
  );

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
      fullCreatePosition.mutate(res.payload, {
        onSuccess: () => {
          setOpenModal(false);
          refetch();
        },
      });
    } else if (res.mode === "editar" && res.id) {
      updatePosition.mutate(
        { id: res.id, data: res.payload },
        {
          onSuccess: () => {
            setOpenModal(false);
            refetch();
          },
        }
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Posiciones</h2>
        <Button onClick={openCreate}>Nueva Posición</Button>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Nombre</th>
              <th className="px-3 py-2 text-left font-medium">
                Unidad de Negocio
              </th>
              <th className="px-3 py-2 text-left font-medium">Usuario</th>
              <th className="px-3 py-2 text-left font-medium">CEO</th>
              <th className="px-3 py-2 text-left font-medium">Estado</th>
              <th className="px-3 py-2 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr>
                <td className="px-3 py-3 text-muted-foreground" colSpan={6}>
                  Cargando...
                </td>
              </tr>
            ) : positions.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-muted-foreground" colSpan={6}>
                  No hay posiciones
                </td>
              </tr>
            ) : (
              positions.map((pos) => (
                <tr key={pos.id} className="border-t">
                  <td className="px-3 py-2">{pos.name}</td>
                  <td className="px-3 py-2">{pos.businessUnitName}</td>
                  <td className="px-3 py-2">{pos.userFullName ?? "—"}</td>
                  <td className="px-3 py-2">
                    <Badge
                      className={
                        pos.isCeo
                          ? "bg-green-500 text-white"
                          : "bg-gray-300 text-gray-800"
                      }
                    >
                      {pos.isCeo ? "Si" : "No"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      className={
                        pos.isActive
                          ? "bg-green-500 text-white"
                          : "bg-gray-300 text-gray-800"
                      }
                    >
                      {pos.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 flex flex-wrap gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openView(pos)}
                      title="Ver"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => openEdit(pos)}
                      title="Editar"
                      className="btn-gradient"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {pos.isActive && (
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => askInactivate(pos)}
                        title="Inactivar"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal crear/editar/ver */}
      <ModalPosition
        isOpen={openModal}
        modo={modo}
        position={current}
        onClose={() => setOpenModal(false)}
        onSave={handleSave}
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
