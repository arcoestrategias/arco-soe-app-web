import http from "@/shared/api/http";
import { unwrapAny } from "@/shared/api/response";
import { routes } from "@/shared/api/routes";
import type { Module, Permission } from "../types/types";

export interface SyncModulePermissionsPayload {
  permissions: Array<{
    id?: string;
    name: string;
    description?: string | null;
    isActive?: boolean;
  }>;
}

export async function getModules(): Promise<Module[]> {
  const res = await http.get(routes.modules.list());
  return unwrapAny<Module[]>(res.data);
}

export async function getModulePermissions(
  moduleId: string
): Promise<Permission[]> {
  const res = await http.get(routes.modules.permissions(moduleId));
  return unwrapAny<Permission[]>(res.data);
}

export async function syncModulePermissions(
  moduleId: string,
  payload: SyncModulePermissionsPayload
) {
  const res = await http.patch(routes.modules.permissions(moduleId), payload);
  return unwrapAny<Permission[]>(res.data);
}
