import http from "@/shared/api/http";
import { routes } from "@/shared/api/routes";
import { unwrapAny } from "@/shared/api/response";
import type {
  CompanyUsersGroupedByBU,
  CreateUserAssignPayload,
  UpdateUserPayload,
  User,
} from "../types/types";

export async function getUsers() {
  const res = await http.get(routes.users.list()); // o .index(), según tu routes
  return unwrapAny<User[]>(res.data); // ← usar res.data
}

export async function getCompanyUsersGrouped(
  companyId: string
): Promise<CompanyUsersGroupedByBU[]> {
  const res = await http.get(routes.users.listByCompanyGrouped(companyId));
  return unwrapAny<CompanyUsersGroupedByBU[]>(res.data);
}

export async function getUsersByBusinessUnit(
  businessUnitId: string
): Promise<User[]> {
  const res = await http.get(routes.users.listByBusinessUnit(businessUnitId));
  return unwrapAny<User[]>(res.data);
}

export async function createUserAssign(payload: CreateUserAssignPayload) {
  const res = await http.post(routes.users.assign(), payload);
  return unwrapAny<User>(res.data); // ← usar res.data
}

export async function updateUser(
  id: string,
  raw: UpdateUserPayload & Record<string, any>
) {
  const {
    roleId,
    businessUnitId,
    positionId,
    isResponsible,
    copyPermissions,
    sendEmailConfirmation,
    companyId,
    password,
    ...patchUser
  } = raw;

  const res = await http.patch(routes.users.update(id), patchUser);
  return unwrapAny<User>(res.data);
}

export async function inactivateUser(id: string) {
  const res = await http.patch(routes.users.update(id), { isActive: false });
  return unwrapAny<User>(res.data);
}
