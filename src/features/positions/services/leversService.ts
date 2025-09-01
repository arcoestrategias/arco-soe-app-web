import { http } from "@/shared/api/http";
import { unwrapAny } from "@/shared/api/response";
import { routes } from "@/shared/api/routes";
import type {
  Lever,
  UpdateLeverPayload,
  ReorderLeversPayload,
  CreateLeverBody,
} from "../types/levers";

export async function getLevers(positionId: string): Promise<Lever[]> {
  const res = await http.get(routes.levers.list(), {
    params: { positionId },
  });
  return unwrapAny<Lever[]>(res.data);
}

export async function createLever(payload: CreateLeverBody): Promise<Lever> {
  const res = await http.post(routes.levers.create(), payload);
  return unwrapAny<Lever>(res.data);
}

export async function updateLever(
  leverId: string,
  payload: UpdateLeverPayload
): Promise<Lever> {
  const { data } = await http.patch(routes.levers.update(leverId), payload);
  return unwrapAny<Lever>(data);
}

export async function reorderLevers(
  payload: ReorderLeversPayload
): Promise<Lever[]> {
  const res = await http.patch(routes.levers.reorder(), payload);
  return unwrapAny<Lever[]>(res.data);
}
