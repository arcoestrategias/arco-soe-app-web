import { http } from "@/shared/api/http";
import { unwrapAny } from "@/shared/api/response";
import { routes } from "@/shared/api/routes";
import type {
  StrategicValue,
  CreateStrategicValueArgs,
  UpdateStrategicValuePayload,
  ReorderStrategicValuesPayload,
} from "../types/strategicValues";

// GET /api/v1/strategic-values?strategicPlanId=...
export async function getStrategicValues(
  strategicPlanId: string
): Promise<StrategicValue[]> {
  const { data } = await http.get(routes.strategicValues.listByPlan(), {
    params: { strategicPlanId },
  });
  return unwrapAny<StrategicValue[]>(data);
}

// POST /api/v1/strategic-values?strategicPlanId=<id>
export async function createStrategicValue(
  args: CreateStrategicValueArgs
): Promise<StrategicValue> {
  const res = await http.post(routes.strategicValues.create(), args);
  return unwrapAny<StrategicValue>(res.data);
}

// PATCH /api/v1/strategic-values/:id
export async function updateStrategicValue(
  strategicValueId: string,
  payload: UpdateStrategicValuePayload
): Promise<StrategicValue> {
  const { data } = await http.patch(
    routes.strategicValues.update(strategicValueId),
    payload
  );
  return unwrapAny<StrategicValue>(data);
}

// PATCH /api/v1/strategic-values/reorder
export async function reorderStrategicValues(
  payload: ReorderStrategicValuesPayload
): Promise<StrategicValue[]> {
  const { data } = await http.patch(routes.strategicValues.reorder, payload);
  return unwrapAny<StrategicValue[]>(data);
}
