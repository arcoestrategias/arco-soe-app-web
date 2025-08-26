"use client";

import { useState } from "react";
import { Plus, Eye, Pencil, Trash, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModalCompany } from "./modal-company";
import type {
  Company,
  CreateCompanyPayload,
  UpdateCompanyPayload,
} from "../types";
import { useCompanies } from "../hooks/use-companies";
import { ConfirmModal } from "@/shared/components/confirm-modal";
import { UploadFilesModal } from "@/shared/components/upload-files-modal";
import { ImageUploader } from "@/shared/components/image-uploader";

const fmtDate = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "medium",
  timeZone: "UTC",
});

type ModalState = {
  open: boolean;
  modo: "crear" | "ver" | "editar";
  company: Company | null;
};

type ConfirmState =
  | { open: false }
  | {
      open: true;
      kind: "update" | "inactivate";
      id?: string;
      payload?: UpdateCompanyPayload;
      title: string;
      message: string;
      confirmText?: string;
    };

export function CompaniesDashboard() {
  const { companies = [], isLoading, create, update, remove } = useCompanies();

  const [modal, setModal] = useState<ModalState>({
    open: false,
    modo: "crear",
    company: null,
  });

  const [docsModal, setDocsModal] = useState<{
    open: boolean;
    company?: Company | null;
  }>({
    open: false,
    company: null,
  });

  const openDocs = (c: Company) => setDocsModal({ open: true, company: c });
  const closeDocs = () => setDocsModal({ open: false, company: null });

  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });

  const openCreate = () =>
    setModal({ open: true, modo: "crear", company: null });
  const openView = (c: Company) =>
    setModal({ open: true, modo: "ver", company: c });
  const openEdit = (c: Company) =>
    setModal({ open: true, modo: "editar", company: c });
  const closeModal = () =>
    setModal({ open: false, modo: "crear", company: null });

  // Sanitiza payloads según tu API (create SIN isActive)
  const toCreate = (p: any): CreateCompanyPayload => ({
    name: p.name,
    ide: p.ide,
    description: p.description || undefined,
    legalRepresentativeName: p.legalRepresentativeName || undefined,
    address: p.address || undefined,
    phone: p.phone || undefined,
    order: p.order ?? null,
    isPrivate: p.isPrivate,
    isGroup: p.isGroup,
  });
  const toUpdate = (p: any): UpdateCompanyPayload => ({
    name: p.name,
    ide: p.ide,
    description: p.description || undefined,
    legalRepresentativeName: p.legalRepresentativeName || undefined,
    address: p.address || undefined,
    phone: p.phone || undefined,
    order: p.order ?? null,
    isPrivate: p.isPrivate,
    isGroup: p.isGroup,
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
      message: "¿Deseas guardar los cambios de esta compañía?",
      confirmText: "Guardar",
    });
  };

  const askInactivate = (c: Company) => {
    setConfirm({
      open: true,
      kind: "inactivate",
      id: c.id,
      title: "Inactivar compañía",
      message: `¿Seguro que deseas inactivar “${c.name}”?`,
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
            <h1 className="text-lg font-semibold">Gestión de Compañías</h1>
            <span className="text-xs rounded-full px-2 py-1 bg-muted">
              {companies.length}
            </span>
          </div>
          <Button onClick={openCreate} size="sm" className="h-8 btn-gradient">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Compañía
          </Button>
        </div>

        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">
            Cargando compañías…
          </div>
        ) : companies.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No hay compañías registradas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-left">Logo</th>
                  <th className="px-4 py-2 text-left">Compañía</th>
                  <th className="px-4 py-2 text-left">Identificación</th>
                  <th className="px-4 py-2 text-left">Descripción</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                  <th className="px-4 py-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="border-t">
                    <td className="px-4 py-2">
                      <ImageUploader
                        referenceId={company.id}
                        name={company.name}
                        size={40}
                      />
                    </td>
                    <td className="px-4 py-2 font-medium">
                      <div>{company.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Creado: {fmtDate.format(new Date(company.createdAt))}
                      </div>
                    </td>
                    <td className="px-4 py-2">{company.ide}</td>
                    <td className="px-4 py-2 truncate max-w-[300px]">
                      {company.description ?? ""}
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        className={
                          company.isActive
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-800"
                        }
                      >
                        {company.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 flex flex-wrap gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openView(company)}
                        title="Ver"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openDocs(company)}
                        title="Documentos"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => openEdit(company)}
                        title="Editar"
                        className="btn-gradient"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => askInactivate(company)}
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

      <ModalCompany
        isOpen={modal.open}
        modo={modal.modo}
        company={modal.company}
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
        referenceId={docsModal.company?.id ?? ""}
        type="document"
        title={`Documentos de ${docsModal.company?.name ?? "la compañía"}`}
      />
    </div>
  );
}
