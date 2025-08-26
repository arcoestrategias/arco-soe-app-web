"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Image as ImageIcon, ExternalLink } from "lucide-react";
import { listFiles } from "@/shared/files/filesService";
import { UploadFilesModal } from "@/shared/components/upload-files-modal";
import { QKEY } from "../api/query-keys";

type ImageUploaderProps = {
  referenceId: string; // id de la entidad (empresa, etc.)
  name?: string; // para alt/title
  size?: number; // diámetro del círculo en px (default 40)
  className?: string;
  // callback opcional si quieres escuchar la nueva URL desde afuera
  onUploaded?: (publicUrl: string) => void;
};

export function ImageUploader({
  referenceId,
  name,
  size = 40,
  className,
  onUploaded,
}: ImageUploaderProps) {
  const qc = useQueryClient();
  const [openModal, setOpenModal] = React.useState(false);

  // Traer logo actual
  const { data: imgUrl } = useQuery({
    queryKey: [QKEY.logo, referenceId],
    queryFn: async () => {
      const res = await listFiles("logo", referenceId);
      return "publicUrl" in res ? res.publicUrl : null;
    },
    refetchOnWindowFocus: false,
  });

  const title = imgUrl ? (name ? `Logo de ${name}` : "Logo") : "Sin logo";

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={title}
            className="relative rounded-full overflow-hidden bg-muted border hover:ring-2 hover:ring-primary/30 transition inline-flex items-center justify-center"
            style={{ width: size, height: size }}
          >
            {imgUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgUrl}
                alt={name || "Logo"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[10px] text-muted-foreground">Logo</span>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start">
          {imgUrl && (
            <DropdownMenuItem asChild>
              <a href={imgUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver logo
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setOpenModal(true)}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Actualizar logo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal reutilizable, sólo imágenes (type=logo) */}
      <UploadFilesModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        referenceId={referenceId}
        type="logo"
        title={`Logo de ${name ?? "la Empresa"}`}
        onUploaded={({ publicUrl }) => {
          // refresca el círculo
          qc.invalidateQueries({ queryKey: [QKEY.logo, referenceId] });
          if (publicUrl) onUploaded?.(publicUrl);
          setOpenModal(false);
        }}
      />
    </div>
  );
}
