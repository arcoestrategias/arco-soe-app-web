import http from "@/shared/api/http";
import { unwrapAny } from "@/shared/api/response";
import { routes } from "@/shared/api/routes";

export type CreateProjectFactorPayload = {
  projectId: string;
  name: string;
  result?: string | null;
};

export type UpdateProjectFactorPayload = Partial<{
  name: string;
  result: string | null;
}>;

export async function createProjectFactor(payload: CreateProjectFactorPayload) {
  const res = await http.post(routes.projectFactors.create(), payload);
  return unwrapAny(res.data);
}

export async function updateProjectFactor(
  id: string,
  payload: UpdateProjectFactorPayload
) {
  const res = await http.patch(routes.projectFactors.update(id), payload);
  return unwrapAny(res.data);
}

export async function setProjectFactorActive(id: string, isActive: boolean) {
  const res = await http.patch(routes.projectFactors.setActive(id), {
    isActive,
  });
  return unwrapAny(res.data);
}

export async function reorderProjectFactors(
  projectId: string,
  items: Array<{ id: string; order: number; isActive: boolean }>
) {
  const res = await http.patch(routes.projectFactors.reorder(), {
    projectId,
    items,
  });
  return unwrapAny(res.data);
}
