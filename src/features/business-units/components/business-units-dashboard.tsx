"use client";

import { useMemo, useState } from "react";
import { Plus, Eye, Pencil, Trash, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/shared/components/confirm-modal";
import { UploadFilesModal } from "@/shared/components/upload-files-modal";
import { ImageUploader } from "@/shared/components/image-uploader";

import type {
  BusinessUnit,
  CreateBusinessUnitPayload,
  UpdateBusinessUnitPayload,
} from "../types/business-unit";
import { useBusinessUnits } from "../hooks/use-business-units";
import { ModalBusinessUnit } from "./modal-business-unit";

import { useQuery } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import { getCompanies } from "@/features/companies/services/companiesService";

const fmtDate = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "medium",
  timeZone: "UTC",
});

type ModalState = {
  open: boolean;
  modo: "crear" | "ver" | "editar";
  businessUnit: BusinessUnit | null;
};

type ConfirmState =
  | { open: false }
  | {
      open: true;
      kind: "update" | "inactivate";
      id?: string;
      payload?: UpdateBusinessUnitPayload;
      title: string;
      message: string;
      confirmText?: string;
    };

export function BusinessUnitsDashboard() {
  const {
    businessUnits = [],
    isLoading,
    create,
    update,
    remove,
  } = useBusinessUnits();
  const { data: companies = [] } = useQuery({
    queryKey: QKEY.companies,
    queryFn: getCompanies,
  });

  const companiesMap = useMemo(() => {
    const m = new Map<string, string>();
    companies.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [companies]);

  const [modal, setModal] = useState<ModalState>({
    open: false,
    modo: "crear",
    businessUnit: null,
  });

  const [docsModal, setDocsModal] = useState<{
    open: boolean;
    item?: BusinessUnit | null;
  }>({
    open: false,
    item: null,
  });

  const openDocs = (u: BusinessUnit) => setDocsModal({ open: true, item: u });
  const closeDocs = () => setDocsModal({ open: false, item: null });

  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });

  const openCreate = () =>
    setModal({ open: true, modo: "crear", businessUnit: null });
  const openView = (u: BusinessUnit) =>
    setModal({ open: true, modo: "ver", businessUnit: u });
  const openEdit = (u: BusinessUnit) =>
    setModal({ open: true, modo: "editar", businessUnit: u });
  const closeModal = () =>
    setModal({ open: false, modo: "crear", businessUnit: null });

  // Sanitiza payloads igual que CompaniesDashboard
  const toCreate = (p: any): CreateBusinessUnitPayload => ({
    name: p.name,
    ide: p.ide || undefined,
    description: p.description || undefined,
    legalRepresentativeName: p.legalRepresentativeName || undefined,
    address: p.address || undefined,
    phone: p.phone || undefined,
    order: p.order ?? null,
    companyId: p.companyId, // requerido
  });

  const toUpdate = (p: any): UpdateBusinessUnitPayload => ({
    name: p.name,
    ide: p.ide || undefined,
    description: p.description || undefined,
    legalRepresentativeName: p.legalRepresentativeName || undefined,
    address: p.address || undefined,
    phone: p.phone || undefined,
    order: p.order ?? null,
    companyId: p.companyId,
    isActive: p.isActive,
  });

  const handleSaveFromModal = (res: {
    mode: "crear" | "editar";
    id?: string;
    payload: any;
  }) => {
    if (res.mode === "crear") {
      create(toCreate(res.payload), { onSuccess: closeModal });
      return;
    }
    setConfirm({
      open: true,
      kind: "update",
      id: res.id!,
      payload: toUpdate(res.payload),
      title: "Guardar cambios",
      message: "¿Deseas guardar los cambios de esta unidad de negocio?",
      confirmText: "Guardar",
    });
  };

  const askInactivate = (u: BusinessUnit) => {
    setConfirm({
      open: true,
      kind: "inactivate",
      id: u.id,
      title: "Inactivar unidad de negocio",
      message: `¿Seguro que deseas inactivar “${u.name}”?`,
      confirmText: "Inactivar",
    });
  };

  const handleConfirm = () => {
    if (!confirm.open) return;

    if (confirm.kind === "update" && confirm.id && confirm.payload) {
      update(
        { id: confirm.id, data: confirm.payload },
        {
          onSuccess: () => {
            setConfirm({ open: false });
            closeModal();
          },
          onError: () => setConfirm({ open: false }),
        }
      );
      return;
    }
    if (confirm.kind === "inactivate" && confirm.id) {
      remove(confirm.id, {
        onSuccess: () => setConfirm({ open: false }),
        onError: () => setConfirm({ open: false }),
      });
      return;
    }
    setConfirm({ open: false });
  };

  const handleCancelConfirm = () => setConfirm({ open: false });

  return (
    <div className="space-y-6">
      <div className="border rounded-md">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">
              Gestión de Unidades de Negocio
            </h1>
            <span className="text-xs rounded-full px-2 py-1 bg-muted">
              {businessUnits.length}
            </span>
          </div>
          <Button onClick={openCreate} size="sm" className="h-8 btn-gradient">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Unidad
          </Button>
        </div>

        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">
            Cargando unidades…
          </div>
        ) : businessUnits.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No hay unidades registradas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-left">Logo</th>
                  <th className="px-4 py-2 text-left">Unidad de Negocio</th>
                  <th className="px-4 py-2 text-left">Identificación</th>
                  <th className="px-4 py-2 text-left">Descripción</th>
                  <th className="px-4 py-2 text-left">Compañía</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                  <th className="px-4 py-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {businessUnits.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-4 py-2">
                      <ImageUploader
                        referenceId={u.id}
                        name={u.name}
                        size={40}
                      />
                    </td>
                    <td className="px-4 py-2 font-medium">
                      <div>{u.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Creado: {fmtDate.format(new Date(u.createdAt))}
                      </div>
                    </td>
                    <td className="px-4 py-2">{u.ide ?? ""}</td>
                    <td className="px-4 py-2 truncate max-w-[300px]">
                      {u.description ?? ""}
                    </td>
                    <td className="px-4 py-2">
                      {u.company?.name ?? companiesMap.get(u.companyId) ?? ""}
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        className={
                          u.isActive
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-800"
                        }
                      >
                        {u.isActive ? "Activa" : "Inactiva"}
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
                        onClick={() => openDocs(u)}
                        title="Documentos"
                      >
                        <Paperclip className="h-4 w-4" />
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
                        className="btn-cancel-gradient"
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

      <ModalBusinessUnit
        isOpen={modal.open}
        modo={modal.modo}
        businessUnit={modal.businessUnit}
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
        onCancel={handleCancelConfirm}
      />

      <UploadFilesModal
        open={docsModal.open}
        onClose={closeDocs}
        referenceId={docsModal.item?.id ?? ""}
        type="document"
        title={`Documentos de ${docsModal.item?.name ?? "la unidad"}`}
      />
    </div>
  );
}
