"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Trash, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { ConfirmModal } from "@/shared/components/confirm-modal";
import { QKEY } from "@/shared/api/query-keys";
import { getHumanErrorMessage } from "@/shared/api/response";
import { getCompanyId } from "@/shared/auth/storage";
import { usePermissions } from "@/shared/auth/access-control";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";

import type {
  StrategicPlan,
  CreateStrategicPlanPayload,
  UpdateStrategicPlanPayload,
} from "../../types/types";
import {
  useStrategicPlans,
  useStrategicPlansByBusinessUnit,
} from "../../hooks/use-strategic-plans";
import { ModalStrategicPlan } from "./modal-strategic-plan";
import { useCompanyBusinessUnits } from "@/features/business-units/hooks/use-business-units";
import type { BusinessUnit } from "@/features/business-units/types";

const fmtDate = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "medium",
  timeZone: "UTC",
});

type ModalState = {
  open: boolean;
  modo: "crear" | "ver" | "editar";
  plan: StrategicPlan | null;
};

function BusinessUnitHeaderCount({
  buId,
  name,
}: {
  buId: string;
  name: string;
}) {
  const { data, isPending } = useStrategicPlansByBusinessUnit(buId);
  const plans = Array.isArray(data) ? data : [];
  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">{name}</span>
      <Badge variant="secondary">{isPending ? "…" : plans.length}</Badge>
    </div>
  );
}

export function StrategicPlansDashboard() {
  const qc = useQueryClient();

  const permissions = usePermissions({
    create: PERMISSIONS.STRATEGIC_PLANS.CREATE,
  });

  // ========= business units por compañía =========
  const companyId = getCompanyId();
  const { businessUnits, isLoading: isLoadingBUs } = useCompanyBusinessUnits(
    companyId || undefined
  );

  // ========= modal plan =========
  const [modal, setModal] = useState<ModalState>({
    open: false,
    modo: "crear",
    plan: null,
  });

  // ========= confirm inactivar (patrón igual a Positions) =========
  const [current, setCurrent] = useState<StrategicPlan | null>(null);
  const [openConfirm, setOpenConfirm] = useState(false);

  // ========= handlers modal =========
  const openCreate = () => setModal({ open: true, modo: "crear", plan: null });
  const openView = (p: StrategicPlan) =>
    setModal({ open: true, modo: "ver", plan: p });
  const openEdit = (p: StrategicPlan) =>
    setModal({ open: true, modo: "editar", plan: p });
  const closeModal = () => setModal({ open: false, modo: "crear", plan: null });

  const { create, update, remove } = useStrategicPlans();

  const handleSaveFromModal = (res: {
    mode: "crear" | "editar";
    id?: string;
    payload: CreateStrategicPlanPayload | UpdateStrategicPlanPayload;
  }) => {
    if (res.mode === "crear") {
      create(
        res.payload as CreateStrategicPlanPayload,
        {
          onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: QKEY.strategicPlans });
            toast.success("Plan estratégico creado");
            closeModal();
          },
          onError: (e: any) => toast.error(getHumanErrorMessage(e)),
        } as any
      );
      return;
    }

    if (res.mode === "editar" && res.id) {
      // Actualiza de una (si quieres confirmar el update, podemos agregar otra ConfirmModal como antes)
      update({ id: res.id, data: res.payload as UpdateStrategicPlanPayload }, {
        onSuccess: async () => {
          await qc.invalidateQueries({ queryKey: QKEY.strategicPlans });
          toast.success("Plan estratégico actualizado");
          closeModal();
        },
        onError: (e: any) => toast.error(getHumanErrorMessage(e)),
      } as any);
    }
  };

  // ========= inactivar: abre confirm como en Positions =========
  const askInactivate = (p: StrategicPlan) => {
    setCurrent(p);
    setOpenConfirm(true);
  };

  const handleInactivate = () => {
    if (!current?.id) return;
    // Si tu backend "inactiva" con un update (isActive=false) en lugar de "remove",
    // cambia esta llamada por update({ id, data: { isActive: false } })
    remove(current.id, {
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: QKEY.strategicPlans });
        toast.success("Plan estratégico inactivado");
        setOpenConfirm(false);
      },
      onError: (e: any) => {
        toast.error(getHumanErrorMessage(e));
        setOpenConfirm(false);
      },
    } as any);
  };

  // ========== UI ==========

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">
            Planes Estratégicos por Unidad de Negocio
          </h1>
          <span className="text-xs rounded-full px-2 py-1 bg-muted">
            {businessUnits.length}
          </span>
        </div>
        {permissions.create && (
          <Button onClick={openCreate} size="sm" className="h-8 btn-gradient">
            <Plus className="h-4 w-4 mr-1" /> Nuevo Plan
          </Button>
        )}
      </div>

      {isLoadingBUs ? (
        <div className="p-4 text-sm text-muted-foreground">
          Cargando unidades de negocio…
        </div>
      ) : businessUnits.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">
          {companyId
            ? "No hay unidades de negocio para esta compañía."
            : "Selecciona/define una compañía para continuar."}
        </div>
      ) : (
        <Accordion type="multiple" className="w-full">
          {businessUnits.map((bu) => (
            <AccordionItem key={bu.id} value={bu.id}>
              <AccordionTrigger className="px-4 py-3 bg-muted/40 hover:no-underline data-[state=open]:bg-muted/60">
                <BusinessUnitHeaderCount buId={bu.id} name={bu.name} />
              </AccordionTrigger>
              <AccordionContent className="px-2">
                <BusinessUnitPlansSection
                  businessUnit={bu}
                  onView={openView}
                  onEdit={openEdit}
                  onInactivate={askInactivate}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <ModalStrategicPlan
        isOpen={modal.open}
        modo={modal.modo}
        plan={modal.plan}
        onClose={closeModal}
        onSave={handleSaveFromModal}
      />

      {/* Confirm inactivar (igual patrón que Positions) */}
      <ConfirmModal
        open={openConfirm}
        title="Inactivar plan"
        message={`¿Seguro que deseas inactivar el plan "${current?.name}"?`}
        confirmText="Inactivar"
        onConfirm={handleInactivate}
        onCancel={() => setOpenConfirm(false)}
      />
    </div>
  );
}

// ======= Sección por BU =======
function BusinessUnitPlansSection({
  businessUnit,
  onView,
  onEdit,
  onInactivate,
}: {
  businessUnit: BusinessUnit;
  onView: (p: StrategicPlan) => void;
  onEdit: (p: StrategicPlan) => void;
  onInactivate: (p: StrategicPlan) => void;
}) {
  const permissions = usePermissions({
    update: PERMISSIONS.STRATEGIC_PLANS.UPDATE,
    delete: PERMISSIONS.STRATEGIC_PLANS.DELETE,
  });

  const { data, isPending, error } = useStrategicPlansByBusinessUnit(
    businessUnit.id
  );

  const plans = useMemo<StrategicPlan[]>(
    () => (Array.isArray(data) ? data : []),
    [data]
  );

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        {getHumanErrorMessage(error)}
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Cargando planes de <b>{businessUnit.name}</b>…
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Sin planes para <b>{businessUnit.name}</b>.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto p-2">
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
          {plans.map((p) => (
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
                      : "bg-gray-500 text-white"
                  }
                >
                  {p.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </td>
              <td className="px-4 py-2 text-center">
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => onView(p)}
                    title="Ver"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {permissions.update && (
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => onEdit(p)}
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
                      onClick={() => onInactivate(p)}
                      title="Inactivar"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
