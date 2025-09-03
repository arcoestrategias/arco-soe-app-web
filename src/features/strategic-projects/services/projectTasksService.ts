// src/features/strategic-projects/services/projectTasksService.ts
import http from "@/shared/api/http";
import { unwrapAny } from "@/shared/api/response";
import { routes } from "@/shared/api/routes";

export type CreateProjectTaskPayload = {
  projectFactorId: string;
  name: string;
  description?: string | null;
  fromAt?: string | null;
  untilAt?: string | null;
  status?: string; // "OPE" según tu ejemplo
  budget?: number | string | null;
  projectParticipantId?: string | null;
};

export type UpdateProjectTaskPayload = Partial<{
  name: string;
  description: string | null;
  fromAt: string | null;
  untilAt: string | null;
  status: string;
  budget: number | string | null;
  projectParticipantId: string | null;
  finishedAt: string | null;
}>;

export async function createProjectTask(payload: CreateProjectTaskPayload) {
  const res = await http.post(routes.projectTasks.create(), payload);
  return unwrapAny(res.data);
}

export async function updateProjectTask(
  id: string,
  payload: UpdateProjectTaskPayload
) {
  const res = await http.patch(routes.projectTasks.update(id), payload);
  return unwrapAny(res.data);
}

export async function setProjectTaskActive(id: string, isActive: boolean) {
  const res = await http.patch(routes.projectTasks.setActive(id), { isActive });
  return unwrapAny(res.data);
}

export async function reorderProjectTasks(
  projectFactorId: string,
  items: Array<{ id: string; order: number; isActive: boolean }>
) {
  const res = await http.patch(routes.projectTasks.reorder(), {
    projectFactorId,
    items,
  });
  return unwrapAny(res.data);
}
