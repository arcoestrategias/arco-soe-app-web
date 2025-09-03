import { http } from "@/shared/api/http";
import { unwrapAny } from "@/shared/api/response";
import { routes } from "@/shared/api/routes";
import type {
  StrategicProject,
  CreateStrategicProjectPayload,
  UpdateStrategicProjectPayload,
  SetStrategicProjectActivePayload,
  ReorderStrategicProjectsPayload,
} from "../types/strategicProjects";
import { StrategicProjectsDashboardData } from "@/features/strategic-projects/types/dashboard";
import { StrategicProjectStructureResponse } from "@/features/strategic-projects/types/strategicProjectStructure";

export async function getStrategicProjectsByPlanPosition(
  strategicPlanId: string,
  positionId: string
): Promise<StrategicProject[]> {
  const res = await http.get(routes.strategicProjects.listByPlanPosition(), {
    params: { strategicPlanId, positionId },
  });
  return unwrapAny<StrategicProject[]>(res.data);
}

export async function getStrategicProjectsByStructure(
  strategicPlanId: string,
  positionId: string
): Promise<StrategicProject[]> {
  const { data } = await http.get(
    routes.strategicProjects.structure(strategicPlanId, positionId)
  );
  return unwrapAny<StrategicProject[]>(data);
}

export async function getStrategicProjectsDashboard(
  strategicPlanId: string,
  positionId: string
): Promise<StrategicProjectsDashboardData> {
  const res = await http.get(
    routes.strategicProjects.dashboard(strategicPlanId, positionId)
  );
  return unwrapAny<StrategicProjectsDashboardData>(res.data);
}

export async function getStrategicProjectStructure(
  projectId: string
): Promise<StrategicProjectStructureResponse> {
  const res = await http.get(
    routes.strategicProjects.structureByProjectId(projectId)
  );
  return unwrapAny<StrategicProjectStructureResponse>(res.data);
}

export async function createStrategicProject(
  payload: CreateStrategicProjectPayload
): Promise<StrategicProject> {
  const { data } = await http.post(routes.strategicProjects.create, payload);
  return unwrapAny<StrategicProject>(data);
}

export async function updateStrategicProject(
  strategicProjectId: string,
  payload: UpdateStrategicProjectPayload
): Promise<StrategicProject> {
  const { data } = await http.patch(
    routes.strategicProjects.update(strategicProjectId),
    payload
  );
  return unwrapAny<StrategicProject>(data);
}

export async function setStrategicProjectActive(
  strategicProjectId: string,
  payload: SetStrategicProjectActivePayload
): Promise<StrategicProject> {
  const { data } = await http.patch(
    routes.strategicProjects.setActive(strategicProjectId),
    payload
  );
  return unwrapAny<StrategicProject>(data);
}

export async function reorderStrategicProjects(
  payload: ReorderStrategicProjectsPayload
): Promise<StrategicProject[]> {
  const { data } = await http.patch(routes.strategicProjects.reorder, payload);
  return unwrapAny<StrategicProject[]>(data);
}
