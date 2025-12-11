import http from "@/shared/api/http";
import { unwrapAny } from "@/shared/api/response";
import { routes } from "@/shared/api/routes";
import type {
  Role,
  CreateRolePayload,
  UpdateRolePayload,
  RolePermission,
  UpdateRolePermissionsPayload,
} from "../types/types";

export async function getRoles(params?: {
  includeInactive: boolean;
}): Promise<Role[]> {
  const res = await http.get(routes.roles.list(params));
  return unwrapAny<Role[]>(res.data);
}

export async function createRole(payload: CreateRolePayload): Promise<Role> {
  const res = await http.post(routes.roles.create(), payload);
  return unwrapAny<Role>(res.data);
}

export async function updateRole(
  id: string,
  payload: UpdateRolePayload
): Promise<Role> {
  const res = await http.patch(routes.roles.update(id), payload);
  return unwrapAny<Role>(res.data);
}

export async function inactivateRole(id: string): Promise<Role> {
  const res = await http.delete(routes.roles.remove(id));
  return unwrapAny(res.data);
}

export async function reactivateRole(id: string): Promise<Role> {
  const res = await http.patch(routes.roles.update(id), { isActive: true });
  return unwrapAny<Role>(res.data);
}

export async function getRolePermissions(
  roleId: string
): Promise<RolePermission[]> {
  const res = await http.get(routes.roles.permissions(roleId));
  return unwrapAny<RolePermission[]>(res.data);
}

export async function updateRolePermissions(
  roleId: string,
  payload: UpdateRolePermissionsPayload
) {
  const res = await http.patch(routes.roles.permissions(roleId), payload);
  return unwrapAny(res.data);
}
