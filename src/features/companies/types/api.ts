// src/features/companies/types/api.ts
import type { CompleteCompany } from "./types";

export interface ApiCompany {
  id: string;
  name: string;
  description?: string | null;
  ide: string; // identificación en backend
  legalRepresentativeName?: string | null;
  address?: string | null;
  phone?: string | null;
  order?: number | null;
  isPrivate?: boolean | null;
  isGroup?: boolean | null;
  isActive: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export type ApiCreateCompanyPayload = {
  name: string;
  ide: string;
  legalRepresentativeName?: string;
  description?: string;
  address?: string;
  phone?: string;
  order?: number;
  isPrivate?: boolean;
  isGroup?: boolean;
};

export type ApiUpdateCompanyPayload = Partial<ApiCreateCompanyPayload>;

/** API -> UI: adapta a tu modelo de pantalla en español */
export function apiToUiCompany(api: ApiCompany): CompleteCompany {
  return {
    id: api.id,
    nombre: api.name,
    identificacion: api.ide,
    descripcion: api.description ?? "",
    logo: undefined, // backend aún no devuelve logo
    fechaCreacion: api.createdAt,
    fechaModificacion: api.updatedAt,
    creadoPor: api.createdBy ?? "",
    modificadoPor: api.updatedBy ?? "",
    activo: api.isActive,
    documentos: [], // por ahora vacíos (tu UI los maneja aparte)
    notas: [], // por ahora vacíos
  };
}

/** UI -> API (create): toma lo que tu formulario envía hoy */
export function uiToApiCreate(
  payload: Pick<CompleteCompany, "nombre" | "identificacion" | "descripcion">
): ApiCreateCompanyPayload {
  return {
    name: payload.nombre,
    ide: payload.identificacion,
    description: payload.descripcion,
    // Campos opcionales del backend se pueden agregar luego
  };
}

/** UI -> API (update): parcial */
export function uiToApiUpdate(
  payload: Partial<
    Pick<CompleteCompany, "nombre" | "identificacion" | "descripcion">
  >
): ApiUpdateCompanyPayload {
  const res: ApiUpdateCompanyPayload = {};
  if (payload.nombre !== undefined) res.name = payload.nombre;
  if (payload.identificacion !== undefined) res.ide = payload.identificacion;
  if (payload.descripcion !== undefined) res.description = payload.descripcion;
  return res;
}
