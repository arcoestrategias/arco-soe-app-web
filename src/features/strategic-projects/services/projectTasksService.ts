import http from "@/shared/api/http";
import { unwrapAny } from "@/shared/api/response";
import { routes } from "@/shared/api/routes";
import type { TaskParticipant } from "../types/strategicProjectStructure";

export type ParticipantInput = {
  positionId?: string;
  externalUserId?: string;
  name?: string;
  email?: string;
};

export type CreateProjectTaskPayload = {
  projectFactorId: string;
  name: string;
  description?: string | null;
  result?: string | null;
  limitation?: string | null;
  methodology?: string | null;
  comments?: string | null;
  props?: string | null;
  fromAt?: string | null;
  untilAt?: string | null;
  status?: string;
  budget?: number | string | null;
  participants?: ParticipantInput[];
};

export type UpdateProjectTaskPayload = Partial<{
  name: string;
  description: string | null;
  result: string | null;
  limitation: string | null;
  methodology: string | null;
  comments: string | null;
  props: string | null;
  fromAt: string | null;
  untilAt: string | null;
  status: string;
  budget: number | string | null;
  finishedAt: string | null;
}>;

export async function createProjectTask(payload: CreateProjectTaskPayload) {
  const res = await http.post(routes.projectTasks.create(), payload);
  return unwrapAny(res.data);
}

export async function updateProjectTask(
  id: string,
  payload: UpdateProjectTaskPayload,
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
  items: Array<{ id: string; order: number; isActive: boolean }>,
) {
  const res = await http.patch(routes.projectTasks.reorder(), {
    projectFactorId,
    items,
  });
  return unwrapAny(res.data);
}

export async function addTaskParticipants(
  taskId: string,
  participants: ParticipantInput[],
): Promise<TaskParticipant[]> {
  const res = await http.post(routes.projectTasks.addParticipants(taskId), {
    participants,
  });
  return unwrapAny<TaskParticipant[]>(res.data);
}

export async function replaceTaskParticipants(
  taskId: string,
  participants: ParticipantInput[],
): Promise<TaskParticipant[]> {
  const res = await http.patch(
    routes.projectTasks.replaceParticipants(taskId),
    { participants },
  );
  return unwrapAny<TaskParticipant[]>(res.data);
}

export async function deleteTaskParticipant(
  taskId: string,
  participantId: string,
): Promise<void> {
  const res = await http.delete(
    routes.projectTasks.deleteParticipant(taskId, participantId),
  );
  return unwrapAny(res.data);
}
