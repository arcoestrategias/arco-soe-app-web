"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Eye, Pencil, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModalCompany } from "./modal-company";
import type { CompleteCompany } from "../types";
import { getCompanies } from "../services/companiesService";
import { fmt } from "@/shared/utils/fmt";

type ModalState = {
  open: boolean;
  modo: "crear" | "ver" | "editar";
  company: CompleteCompany | null;
};

export function CompaniesDashboard() {
  // 1) Trae los datos directamente (sin hook intermedio)
  const {
    data: companies = [],
    isLoading,
    isFetching,
    error,
  } = useQuery<CompleteCompany[]>({
    queryKey: ["companies"],
    queryFn: getCompanies,
    refetchOnWindowFocus: false,
  });

  const [modal, setModal] = useState<ModalState>({
    open: false,
    modo: "crear",
    company: null,
  });

  const openCreate = () =>
    setModal({ open: true, modo: "crear", company: null });
  const openView = (empresa: CompleteCompany) =>
    setModal({ open: true, modo: "ver", company: empresa });
  const openEdit = (empresa: CompleteCompany) =>
    setModal({ open: true, modo: "editar", company: empresa });
  const closeModal = () =>
    setModal({ open: false, modo: "crear", company: null });

  // 3) Render mínimo para confirmar
  return (
    <div className="space-y-6">
      <div className="border rounded-md">
        {/* ✅ Header del card con título + botón alineados a la izquierda */}
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className="text-lg font-semibold">Gestión de Compañías</h1>
          <Button onClick={openCreate} size="sm" className="h-8">
            <Plus className="h-4 w-4 mr-2" />
            Nueva
          </Button>
        </div>

        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">
            Cargando empresas…
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">
            Error cargando empresas
          </div>
        ) : companies.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No hay empresas registradas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-left">Logo</th>
                  <th className="px-4 py-2 text-left">Empresa</th>
                  <th className="px-4 py-2 text-left">Identificación</th>
                  <th className="px-4 py-2 text-left">Descripción</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((empresa) => (
                  <tr key={empresa.id} className="border-t">
                    <td className="px-4 py-2">
                      <div className="w-10 h-10 rounded overflow-hidden bg-muted flex items-center justify-center" />
                    </td>
                    <td className="px-4 py-2 font-medium">
                      <div>{empresa.nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        Creado: {fmt.format(new Date(empresa.fechaCreacion))}
                      </div>
                    </td>
                    <td className="px-4 py-2">{empresa.identificacion}</td>
                    <td className="px-4 py-2 truncate max-w-[300px]">
                      {empresa.descripcion}
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        className={
                          empresa.activo
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-800"
                        }
                      >
                        {empresa.activo ? "Activa" : "Inactiva"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openView(empresa)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => openEdit(empresa)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => alert("Eliminar pendiente")}
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
        onSave={() => {}}
      />
    </div>
  );
}
