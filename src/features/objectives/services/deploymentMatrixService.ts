import { http } from "@/shared/api/http";
import { routes } from "@/shared/api/routes";
import { unwrapAny } from "@/shared/api/response";
import type {
  DeploymentMatrixResponse,
  CollaborationItem,
} from "../types/deployment-matrix";

export async function getDeploymentMatrixData(
  strategicPlanId: string,
  positionId: string,
  year?: number | string,
): Promise<DeploymentMatrixResponse> {
  const url = routes.objectives.deploymentMatrix(strategicPlanId, positionId);
  const res = await http.get(url, { params: { year } });
  return unwrapAny<DeploymentMatrixResponse>(res);
}

export async function getCollaborationsData(
  strategicPlanId: string,
  positionId: string,
  year?: number | string,
): Promise<CollaborationItem[]> {
  const url = routes.objectives.collaborations(strategicPlanId, positionId);
  const res = await http.get(url, { params: { year } });
  return unwrapAny<CollaborationItem[]>(res);
}

export async function assignResponsibility(payload: {
  objectiveId: string;
  positionId: string;
  type: string;
}) {
  const url = routes.objectives.responsibilities();
  const res = await http.post(url, payload);
  return unwrapAny(res);
}

export async function deleteResponsibility(id: string) {
  const url = routes.objectives.responsibility(id);
  const res = await http.delete(url);
  return unwrapAny(res);
}
