"use client";

import { useState } from "react";
import { Eye, Pencil, Trash, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/shared/components/confirm-modal";
import { QKEY } from "@/shared/api/query-keys";
import { getHumanErrorMessage } from "@/shared/api/response";

import type {
  StrategicPlan,
  CreateStrategicPlanPayload,
  UpdateStrategicPlanPayload,
} from "../../types/types";
import { useStrategicPlans } from "../../hooks/use-strategic-plans";
import { ModalStrategicPlan } from "./modal-strategic-plan";

const fmtDate = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "medium",
  timeZone: "UTC",
});

type ModalState = {
  open: boolean;
  modo: "crear" | "ver" | "editar";
  plan: StrategicPlan | null;
};

type ConfirmState =
  | { open: false }
  | {
      open: true;
      kind: "update" | "inactivate";
      id?: string;
      payload?: UpdateStrategicPlanPayload;
      title: string;
      message: string;
      confirmText?: string;
    };

export function StrategicPlansDashboard() {
  const qc = useQueryClient();
  const {
    strategicPlans = [],
    isLoading,
    create,
    update,
    remove,
  } = useStrategicPlans();

  const [modal, setModal] = useState<ModalState>({
    open: false,
    modo: "crear",
    plan: null,
  });
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });

  const openCreate = () => setModal({ open: true, modo: "crear", plan: null });
  const openView = (p: StrategicPlan) =>
    setModal({ open: true, modo: "ver", plan: p });
  const openEdit = (p: StrategicPlan) =>
    setModal({ open: true, modo: "editar", plan: p });
  const closeModal = () => setModal({ open: false, modo: "crear", plan: null });

  const handleSaveFromModal = (res: {
    mode: "crear" | "editar";
    id?: string;
    payload: CreateStrategicPlanPayload | UpdateStrategicPlanPayload;
  }) => {
    if (res.mode === "crear") {
      // payload de creación
      const createPayload = res.payload as CreateStrategicPlanPayload;
      create(createPayload, {
        onSuccess: async () => {
          await qc.invalidateQueries({ queryKey: QKEY.strategicPlans });
          toast.success("Plan estratégico creado");
          closeModal();
        },
        onError: (e: any) => toast.error(getHumanErrorMessage(e)),
      } as any);
      return;
    }

    // payload de actualización (con isActive y demás)
    const updatePayload = res.payload as UpdateStrategicPlanPayload;
    setConfirm({
      open: true,
      kind: "update",
      id: res.id,
      payload: updatePayload,
      title: "Guardar cambios",
      message: "¿Deseas guardar los cambios del plan estratégico?",
      confirmText: "Guardar",
    });
  };

  const askInactivate = (p: StrategicPlan) =>
    setConfirm({
      open: true,
      kind: "inactivate",
      id: p.id,
      title: "Inactivar plan estratégico",
      message: `¿Seguro que deseas inactivar “${p.name}”?`,
      confirmText: "Inactivar",
    });

  const handleConfirm = () => {
    if (!confirm.open) return;

    if (confirm.kind === "update" && confirm.id && confirm.payload) {
      update({ id: confirm.id, data: confirm.payload }, {
        onSuccess: async () => {
          await qc.invalidateQueries({ queryKey: QKEY.strategicPlans });
          toast.success("Plan estratégico actualizado");
          setConfirm({ open: false });
          closeModal();
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
          await qc.invalidateQueries({ queryKey: QKEY.strategicPlans });
          toast.success("Plan estratégico inactivado");
          setConfirm({ open: false });
        },
        onError: (e: any) => {
          toast.error(getHumanErrorMessage(e));
          setConfirm({ open: false });
        },
      } as any);
      return;
    }

    setConfirm({ open: false });
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-md">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Planes Estratégicos</h1>
            <span className="text-xs rounded-full px-2 py-1 bg-muted">
              {strategicPlans.length}
            </span>
          </div>
          <Button onClick={openCreate} size="sm" className="h-8 btn-gradient">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo
          </Button>
        </div>

        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">
            Cargando planes…
          </div>
        ) : strategicPlans.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No hay planes registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">Descripción</th>
                  <th className="px-4 py-2 text-left">Fecha Desde</th>
                  <th className="px-4 py-2 text-left">Fecha Hasta</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                  <th className="px-4 py-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {strategicPlans.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-2 font-medium">{p.name}</td>
                    <td className="px-4 py-2">{p.description ?? ""}</td>
                    <td className="px-4 py-2">
                      {fmtDate.format(new Date(p.fromAt))}
                    </td>
                    <td className="px-4 py-2">
                      {fmtDate.format(new Date(p.untilAt))}
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        className={
                          p.isActive
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-800"
                        }
                      >
                        {p.isActive ? "Activo" : "Inactivo"}
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
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => openEdit(p)}
                        title="Editar"
                        className="btn-gradient"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => askInactivate(p)}
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

      <ModalStrategicPlan
        isOpen={modal.open}
        modo={modal.modo}
        plan={modal.plan}
        onClose={closeModal}
        onSave={handleSaveFromModal}
      />

      <ConfirmModal
        open={confirm.open}
        title={confirm.open ? confirm.title : ""}
        message={confirm.open ? confirm.message : ""}
        confirmText={confirm.open ? confirm.confirmText : undefined}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm({ open: false })}
      />
    </div>
  );
}
