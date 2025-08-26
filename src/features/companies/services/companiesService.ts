import http from "@/shared/api/http";
import { routes } from "@/shared/api/routes";
import { unwrapAny } from "@/shared/api/response";
import type {
  Company,
  CreateCompanyPayload,
  UpdateCompanyPayload,
} from "../types";

/** LISTAR */
export async function getCompanies(): Promise<Company[]> {
  const res = await http.get(routes.companies.list());
  return unwrapAny<Company[]>(res);
}

/** OBTENER */
export async function getCompanyById(id: string): Promise<Company> {
  const res = await http.get(routes.companies.byId(id));
  return unwrapAny<Company>(res);
}

/** CREAR (FULL) */
export async function fullCreateCompany(
  payload: CreateCompanyPayload
): Promise<Company> {
  // Asegúrate de tener este route en routes.companies.fullCreate()
  const res = await http.post(routes.companies.fullCreate(), payload);
  return unwrapAny<Company>(res);
}

/** ACTUALIZAR */
export async function updateCompany(
  id: string,
  payload: UpdateCompanyPayload
): Promise<Company> {
  const res = await http.patch(routes.companies.update(id), payload);
  return unwrapAny<Company>(res);
}

/** INACTIVAR (soft delete) */
export async function inactivateCompany(id: string): Promise<Company> {
  const res = await http.patch(routes.companies.update(id), {
    isActive: false,
  });
  return unwrapAny<Company>(res);
}
