import http from "@/shared/api/http";
import { routes } from "@/shared/api/routes";
import { unwrapAny } from "@/shared/api/response";

export type PatchUserBusinessUnitPayload = {
  roleId?: string;
  positionId?: string | null;
  isResponsible?: boolean;
};
export async function patchUserBusinessUnit(
  userId: string,
  businessUnitId: string,
  body: PatchUserBusinessUnitPayload
) {
  const res = await http.patch(
    routes.users.patchUserBusinessUnit(userId, businessUnitId),
    body
  );
  return unwrapAny<any>(res.data);
}
