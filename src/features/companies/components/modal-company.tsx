"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, X } from "lucide-react";
import { useState, useEffect } from "react";
import type { CompleteCompany, Documento, Nota } from "../types/types";
import { SectionInformation } from "./section-information";
import { SectionDocuments } from "./section-documents";
import { SectionNotes } from "./section-notes";
import { fmt } from "@/shared/utils/fmt";

interface ModalCompanyProps {
  isOpen: boolean;
  onClose: () => void;
  company?: CompleteCompany | null;
  onSave: (company: CompleteCompany) => void;
  modo: "crear" | "editar" | "ver";
}

export function ModalCompany({
  isOpen,
  onClose,
  company,
  onSave,
  modo,
}: ModalCompanyProps) {
  const [data, setData] = useState({
    nombre: "",
    identificacion: "",
    descripcion: "",
    logo: undefined as string | undefined,
  });
  const [documents, setDocuments] = useState<Documento[]>([]);
  const [notes, setNotes] = useState<Nota[]>([]);
  const [activeTab, setActiveTab] = useState("informacion");

  useEffect(() => {
    if (company) {
      setData({
        nombre: company.nombre,
        identificacion: company.identificacion,
        descripcion: company.descripcion ?? "",
        logo: company.logo,
      });
      setDocuments(company.documentos || []);
      setNotes(company.notas || []);
    } else {
      setData({
        nombre: "",
        identificacion: "",
        descripcion: "",
        logo: undefined,
      });
      setDocuments([]);
      setNotes([]);
    }
    setActiveTab("informacion");
  }, [company, isOpen]);

  const handleSave = () => {
    if (!data.nombre.trim() || !data.identificacion.trim()) {
      alert("Por favor complete los campos obligatorios");
      return;
    }

    const newCompany: CompleteCompany = {
      id: company?.id || `emp-${fmt.format(new Date())}`,
      ...data,
      fechaCreacion: company?.fechaCreacion || new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
      creadoPor: company?.creadoPor || "Usuario Actual",
      modificadoPor: "Usuario Actual",
      activo: company?.activo ?? true,
      documentos: documents,
      notas: notes,
    };

    onSave(newCompany);
    onClose();
  };

  const readonly = modo === "ver";
  const title =
    modo === "crear"
      ? "Nueva Empresa"
      : modo === "editar"
      ? "Editar Empresa"
      : "Ver Empresa";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {title}
              </DialogTitle>
              {readonly && <Badge variant="secondary">Solo lectura</Badge>}
            </div>
            {!readonly && (
              <Button
                onClick={handleSave}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="informacion">Información</TabsTrigger>
              <TabsTrigger value="documentos">
                Documentos
                {documents.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {documents.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="notas">
                Notas
                {notes.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {notes.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4 px-1">
              {/* <TabsContent value="informacion" className="mt-0">
                <SectionInformation
                  titulo="Información de la Empresa"
                  datos={data}
                  onDatosC  hange={setData}
                  readonly={readonly}
                />
              </TabsContent> */}

              <TabsContent value="documentos" className="mt-0">
                <SectionDocuments
                  titulo="Documentos de la Empresa"
                  documentos={documents}
                  onDocumentosChange={setDocuments}
                  readonly={readonly}
                />
              </TabsContent>

              <TabsContent value="notas" className="mt-0">
                <SectionNotes
                  titulo="Notas y Comentarios"
                  notas={notes}
                  onNotasChange={setNotes}
                  readonly={readonly}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {company && (
          <div className="flex-shrink-0 border-t pt-4 mt-4">
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <span className="font-medium">Creado:</span>{" "}
                {fmt.format(new Date(company.fechaCreacion))} por{" "}
                {company.creadoPor}
              </div>
              <div>
                <span className="font-medium">Modificado:</span>{" "}
                {new Date(company.fechaModificacion).toLocaleString()} por{" "}
                {company.modificadoPor}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
