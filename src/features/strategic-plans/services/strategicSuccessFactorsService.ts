import http from "@/shared/api/http";
import { routes } from "@/shared/api/routes";
import { unwrapAny } from "@/shared/api/response";
import type {
  StrategicSuccessFactor,
  CreateStrategicSuccessFactorPayload,
  UpdateStrategicSuccessFactorPayload,
  ReorderStrategicSuccessFactorsPayload,
} from "../types/types";

export async function getStrategicSuccessFactors(strategicPlanId: string) {
  const res = await http.get(routes.strategicSuccessFactors.index(), {
    params: { strategicPlanId },
  });
  return unwrapAny<StrategicSuccessFactor[]>(res.data);
}

export async function createStrategicSuccessFactor(
  payload: CreateStrategicSuccessFactorPayload
) {
  const res = await http.post(routes.strategicSuccessFactors.create(), payload);
  return unwrapAny<StrategicSuccessFactor>(res.data);
}

export async function updateStrategicSuccessFactor(
  id: string,
  data: UpdateStrategicSuccessFactorPayload
) {
  const res = await http.patch(routes.strategicSuccessFactors.update(id), data);
  return unwrapAny<StrategicSuccessFactor>(res.data);
}


export async function reorderStrategicSuccessFactors(
  payload: ReorderStrategicSuccessFactorsPayload
) {
  const res = await http.patch(
    routes.strategicSuccessFactors.reorder(),
    payload
  );
  return unwrapAny<{ updated: number } | any>(res.data);
}
