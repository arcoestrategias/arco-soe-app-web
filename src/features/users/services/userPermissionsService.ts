import http from "@/shared/api/http";
import { routes } from "@/shared/api/routes";
import { unwrapAny } from "@/shared/api/response";
import type {
  UserPermission,
  UpdateUserPermissionsPayload,
} from "../types/types";

export async function getUserPermissions(
  businessUnitId: string,
  userId: string
): Promise<UserPermission[]> {
  const res = await http.get(
    routes.businessUnits.userPermissions(businessUnitId, userId)
  );
  return unwrapAny<UserPermission[]>(res.data);
}

export async function updateUserPermissions(
  businessUnitId: string,
  userId: string,
  payload: UpdateUserPermissionsPayload
) {
  const res = await http.patch(
    routes.businessUnits.userPermissions(businessUnitId, userId),
    payload
  );
  return unwrapAny<any>(res.data);
}
