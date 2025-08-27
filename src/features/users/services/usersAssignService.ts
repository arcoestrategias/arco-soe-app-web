import http from "@/shared/api/http";
import { routes } from "@/shared/api/routes";
import { unwrapAny } from "@/shared/api/response";

export type AssignToBusinessUnitPayload = {
  userId: string;
  businessUnitId: string;
  roleId: string;
  isResponsible: boolean;
  copyPermissions: boolean;
};
export async function assignUserToBusinessUnit(
  payload: AssignToBusinessUnitPayload
) {
  const res = await http.post(routes.users.assignToBusinessUnit(), payload);
  return unwrapAny<any>(res.data);
}
