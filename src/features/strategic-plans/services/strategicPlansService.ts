import http from "@/shared/api/http";
import { routes } from "@/shared/api/routes";
import { unwrapAny } from "@/shared/api/response";
import type {
  StrategicPlan,
  CreateStrategicPlanPayload,
  UpdateStrategicPlanPayload,
} from "../types/types";

export async function getStrategicPlans() {
  const res = await http.get(routes.strategicPlans.list());
  return unwrapAny<StrategicPlan[]>(res.data);
}

export async function createStrategicPlan(payload: CreateStrategicPlanPayload) {
  const res = await http.post(routes.strategicPlans.create(), payload);
  return unwrapAny<StrategicPlan>(res.data);
}

export async function updateStrategicPlan(
  id: string,
  data: UpdateStrategicPlanPayload
) {
  const res = await http.patch(routes.strategicPlans.update(id), data);
  return unwrapAny<StrategicPlan>(res.data);
}

export async function inactivateStrategicPlan(id: string) {
  const res = await http.patch(routes.strategicPlans.update(id), {
    isActive: false,
  });
  return unwrapAny<StrategicPlan>(res.data);
}

export async function getStrategicPlan(id: string) {
  const res = await http.get(routes.strategicPlans.show(id));
  return unwrapAny<StrategicPlan>(res.data);
}

export async function getStrategicPlansByBusinessUnit(businessUnitId: string) {
  const res = await http.get(routes.strategicPlans.list(), {
    params: { businessUnitId },
  });
  return unwrapAny<StrategicPlan[]>(res.data);
}
