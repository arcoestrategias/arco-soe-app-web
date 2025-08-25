import http from "@/shared/api/http";

import { routes } from "@/shared/api/routes";
import { unwrapAny } from "@/shared/api/response";
import type { CompleteCompany } from "../types";

type ApiCompany = {
  id: string;
  name: string;
  description?: string | null;
  ide: string;
  legalRepresentativeName?: string | null;
  address?: string | null;
  phone?: string | null;
  order?: number | null;
  isPrivate?: boolean | null;
  isGroup?: boolean | null;
  isActive: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

const apiToUi = (x: ApiCompany): CompleteCompany => ({
  id: x.id,
  nombre: x.name,
  identificacion: x.ide,
  descripcion: x.description ?? "",
  logo: undefined,
  fechaCreacion: x.createdAt,
  fechaModificacion: x.updatedAt,
  creadoPor: x.createdBy ?? "",
  modificadoPor: x.updatedBy ?? "",
  activo: x.isActive,
  documentos: [],
  notas: [],
});

export async function getCompanies(): Promise<CompleteCompany[]> {
  const res = await http.get(routes.companies.list());
  // Extrae el payload: soporta envelope { data: [...] } o payload plano [...]
  const payload = unwrapAny<ApiCompany[] | { items: ApiCompany[] }>(res);
  const list = Array.isArray(payload) ? payload : payload.items ?? [];
  return list.map(apiToUi);
}

export async function getCompanyById(id: string): Promise<CompleteCompany> {
  const res = await http.get(routes.companies.byId(id));
  const data = unwrapAny<ApiCompany>(res);
  return apiToUi(data);
}

export async function createCompany(
  input: Pick<CompleteCompany, "nombre" | "identificacion" | "descripcion">
): Promise<CompleteCompany> {
  const body = {
    name: input.nombre,
    ide: input.identificacion,
    description: input.descripcion,
  };
  const res = await http.post(routes.companies.create(), body);
  const created = unwrapAny<ApiCompany>(res);
  return apiToUi(created);
}

export async function updateCompany(
  id: string,
  input: Partial<
    Pick<CompleteCompany, "nombre" | "identificacion" | "descripcion">
  >
): Promise<CompleteCompany> {
  const body: Record<string, unknown> = {};
  if (input.nombre !== undefined) body.name = input.nombre;
  if (input.identificacion !== undefined) body.ide = input.identificacion;
  if (input.descripcion !== undefined) body.description = input.descripcion;

  const res = await http.patch(routes.companies.update(id), body);
  const updated = unwrapAny<ApiCompany>(res);
  return apiToUi(updated);
}

export async function deleteCompany(id: string): Promise<void> {
  const res = await http.delete(routes.companies.remove(id));
  // Si tu back devuelve envelope con null, esto no rompe:
  unwrapAny<null>(res);
}
