// src/shared/components/upload-files-modal.tsx
"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Eye, Download } from "lucide-react";
import { listFiles, uploadFiles } from "@/shared/files/filesService";
import type { UploadType, FileItem } from "@/shared/files/types";
import { getHumanErrorMessage } from "@/shared/api/response";
import { ActionButton } from "@/components/ui/action-button";

const fmtDate = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "medium",
  timeZone: "UTC",
});

type UploadFilesModalProps = {
  open: boolean;
  onClose: () => void;
  referenceId: string;
  type: UploadType; // "logo" | "document"
  title?: string;
  onUploaded?: (data: {
    type: UploadType;
    items?: FileItem[];
    publicUrl?: string;
  }) => void;
};

const ACCEPT_DOCS =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv";

// === Validaciones de tamaño ===
const MB = 1024 * 1024;
const LIMITS = {
  logo: 5 * MB, // 5 MB
  document: 20 * MB, // 20 MB c/u
} as const;
const isImage = (file: File) => file.type.startsWith("image/");
const humanSize = (b: number) => `${(b / MB).toFixed(1)} MB`;

export function UploadFilesModal({
  open,
  onClose,
  referenceId,
  type,
  title,
  onUploaded,
}: UploadFilesModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState<FileItem[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Carga inicial al abrir
  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoadingList(true);
      try {
        const data = await listFiles(type, referenceId);
        if ("publicUrl" in data) {
          setLogoUrl(data.publicUrl);
          setItems([]);
        } else if ("items" in data) {
          setItems(data.items ?? []);
          setLogoUrl(null);
        }
      } catch (e) {
        toast.error(getHumanErrorMessage(e));
      } finally {
        setLoadingList(false);
      }
    })();
  }, [open, type, referenceId]);

  const chooseFiles = () => inputRef.current?.click();

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Validaciones UI
    if (type === "logo") {
      if (files.length > 1) {
        toast.error("Solo puedes subir una imagen como logo.");
        return;
      }
      const f = files[0];
      if (!isImage(f)) {
        toast.error(
          `El logo debe ser una imagen. Recibido: ${f.type || f.name}`
        );
        return;
      }
      if (f.size > LIMITS.logo) {
        toast.error(`El logo supera 5 MB (peso: ${humanSize(f.size)}).`);
        return;
      }
    } else {
      // type === "document"
      const arr = Array.from(files);
      const tooBig = arr.filter((f) => f.size > LIMITS.document);
      if (tooBig.length > 0) {
        const names = tooBig
          .slice(0, 3)
          .map((f) => f.name)
          .join(", ");
        toast.error(
          `Algunos documentos superan 20 MB: ${names}${
            tooBig.length > 3 ? "..." : ""
          }`
        );
        return;
      }
    }

    setUploading(true);
    try {
      const arr = Array.from(files);
      const data = await uploadFiles(type, referenceId, arr);

      if ("publicUrl" in data) {
        setLogoUrl(data.publicUrl);
        toast.success("Logo actualizado");
        onUploaded?.({ type, publicUrl: data.publicUrl });
      } else if ("items" in data) {
        // prepend nuevos al listado
        setItems((prev) => [...(data.items ?? []), ...prev]);
        toast.success(
          (data.items?.length || 0) > 1
            ? "Documentos subidos"
            : "Documento subido"
        );
        onUploaded?.({ type, items: data.items ?? [] });
      }
    } catch (e) {
      toast.error(getHumanErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    onFiles(e.dataTransfer.files);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {title ??
              (type === "logo"
                ? "Logo de la Empresa"
                : "Documentos de la Empresa")}
          </DialogTitle>
        </DialogHeader>

        {/* Zona de subida */}
        <div
          className={`rounded-md border-2 border-dashed p-8 text-center transition-colors ${
            dragOver
              ? "border-primary/60 bg-primary/5"
              : "border-muted-foreground/20"
          }`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          <Upload className="mx-auto mb-2 h-6 w-6 opacity-70" />
          <p className="text-sm mb-2">
            Arrastra archivos aquí o haz clic para seleccionar
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {type === "logo"
              ? "Logo: máx. 5 MB (solo imágenes)"
              : "Documentos: máx. 20 MB c/u"}
          </p>
          {/* <Button
            type="button"
            variant="secondary"
            onClick={chooseFiles}
            disabled={uploading}
          >
            Seleccionar Archivos
          </Button> */}
          <ActionButton
            label="Seleccionar Archivos"
            onAction={chooseFiles}
            disabled={uploading}
          />

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple={type === "document"}
            accept={type === "logo" ? "image/*" : ACCEPT_DOCS}
            onChange={(e) => onFiles(e.target.files)}
          />
        </div>

        {/* Listado */}
        <div className="space-y-3 mt-4">
          {loadingList ? (
            <div className="text-sm text-muted-foreground">Cargando…</div>
          ) : type === "logo" ? (
            logoUrl ? (
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-3">
                  {/* preview */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-10 w-10 rounded object-cover"
                  />
                  <div className="text-sm">
                    <div className="font-medium">Logo actual</div>
                    <a
                      href={logoUrl}
                      target="_blank"
                      className="text-xs underline text-primary"
                    >
                      Ver en nueva pestaña
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Aún no hay logo.
              </div>
            )
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Aún no hay documentos.
            </div>
          ) : (
            items.map((d, i) => (
              <div
                key={`${d.publicUrl}-${i}`}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <div className="font-medium">
                    {d.originalName ?? "Documento"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {d.createdAt ? fmtDate.format(new Date(d.createdAt)) : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" asChild title="Ver">
                    <a
                      href={d.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" asChild title="Descargar">
                    <a href={d.publicUrl} download={d.originalName ?? true}>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <ActionButton
            type="button"
            label="Cerrar"
            variant={"outline"}
            onAction={onClose}
            disabled={uploading}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
