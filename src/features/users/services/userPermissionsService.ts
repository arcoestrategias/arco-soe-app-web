import http from "@/shared/api/http";
import { routes } from "@/shared/api/routes";
import { unwrapAny } from "@/shared/api/response";

export type PermissionFlags = {
  access: boolean;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  export: boolean;
  approve: boolean;
  assign: boolean;
};

export type PermissionModules = Record<string, PermissionFlags>; // e.g. "businessUnit": { ... }

export async function getUserPermissions(
  businessUnitId: string,
  userId: string
): Promise<PermissionModules> {
  const res = await http.get(
    routes.businessUnits.userPermissions(businessUnitId, userId)
  );
  // unwrapAny → { modules: { ... } }
  const { modules } = unwrapAny<{ modules: PermissionModules }>(res.data);
  return modules ?? {};
}

export async function updateUserPermissions(
  businessUnitId: string,
  userId: string,
  permissions: Record<string, boolean>
) {
  const res = await http.put(
    routes.businessUnits.userPermissions(businessUnitId, userId),
    { permissions }
  );
  return unwrapAny<any>(res.data);
}
