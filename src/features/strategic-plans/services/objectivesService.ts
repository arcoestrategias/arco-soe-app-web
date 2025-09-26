import { http } from "@/shared/api/http";
import { unwrapAny } from "@/shared/api/response";
import { routes } from "@/shared/api/routes";
import type {
  Objective,
  CreateObjectivePayload,
  UpdateObjectivePayload,
  ReorderObjectivesPayload,
  UnconfiguredObjective,
  ConfigureObjectiveDto,
  ConfigureObjectiveResponse,
} from "../types/objectives";

export async function getObjectives(
  strategicPlanId: string,
  positionId: string
): Promise<Objective[]> {
  const res = await http.get(routes.objectives.listByPlan(), {
    params: { strategicPlanId, positionId },
  });

  return unwrapAny<Objective[]>(res.data);
}

export async function getUnconfiguredObjectives(
  strategicPlanId: string,
  positionId: string
): Promise<UnconfiguredObjective[]> {
  const res = await http.get(routes.objectives.unconfigured(), {
    params: { strategicPlanId, positionId },
  });
  return unwrapAny<UnconfiguredObjective[]>(res.data);
}

export async function createObjective(
  payload: CreateObjectivePayload
): Promise<Objective> {
  const { data } = await http.post(routes.objectives.create(), payload);
  return unwrapAny<Objective>(data);
}

export async function updateObjective(
  objectiveId: string,
  payload: UpdateObjectivePayload
): Promise<Objective> {
  const { data } = await http.patch(
    routes.objectives.update(objectiveId),
    payload
  );
  return unwrapAny<Objective>(data);
}

export async function reorderObjectives(
  payload: ReorderObjectivesPayload
): Promise<void> {
  const { data } = await http.patch(routes.objectives.reorder(), payload);
  unwrapAny(data);
}

export async function configureObjective(
  objectiveId: string,
  payload: Omit<ConfigureObjectiveDto, "objectiveId">
) {
  const { data } = await http.patch(routes.objectives.configure(objectiveId), {
    objectiveId,
    ...payload,
  });
  return unwrapAny<ConfigureObjectiveResponse>(data);
}
