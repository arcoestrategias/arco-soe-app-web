import http from "@/shared/api/http";
import { routes } from "@/shared/api/routes";
import { unwrapAny } from "@/shared/api/response";
import type {
  BusinessUnit,
  CreateBusinessUnitPayload,
  UpdateBusinessUnitPayload,
} from "../types/business-unit";
import { BusinessUnitUser } from "../types/business-unit-users";

export async function getBusinessUnits() {
  const res = await http.get(routes.businessUnits.list());
  return unwrapAny<BusinessUnit[]>(res);
}

export async function createBusinessUnit(payload: CreateBusinessUnitPayload) {
  // No enviar isActive en create
  const res = await http.post(routes.businessUnits.create(), payload);
  return unwrapAny<BusinessUnit>(res);
}

export async function updateBusinessUnit(
  id: string,
  payload: UpdateBusinessUnitPayload
) {
  const res = await http.patch(routes.businessUnits.update(id), payload);
  return unwrapAny<BusinessUnit>(res);
}

export async function inactivateBusinessUnit(id: string) {
  const res = await http.patch(routes.businessUnits.update(id), {
    isActive: false,
  });
  return unwrapAny<BusinessUnit>(res);
}

export async function getBusinessUnitUsers(
  businessUnitId: string
): Promise<BusinessUnitUser[]> {
  const { data } = await http.get(routes.businessUnits.users(businessUnitId));
  return unwrapAny<BusinessUnitUser[]>(data);
}
