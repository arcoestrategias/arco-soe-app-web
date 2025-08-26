// src/shared/files/types.ts
export type UploadType = "logo" | "document";

export type FileItem = {
  publicUrl: string;
  originalName?: string | null;
  description?: string | null;
  createdAt?: string | null;
};

export type GetFilesData =
  | { success: true; publicUrl: string } // logo
  | { success: true; items: FileItem[] }; // documentos

export type PostFilesData =
  | { success: true; publicUrl: string } // logo
  | { success: true; items: FileItem[] }; // documentos
