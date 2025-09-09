import { http } from "@/shared/api/http";
import { unwrapAny } from "@/shared/api/response";
import { routes } from "@/shared/api/routes";
import type {
  Position,
  CreatePositionPayload,
  UpdatePositionPayload,
  PositionsByCompanyGroupBU,
} from "../types/positions";

export async function getPositions(): Promise<Position[]> {
  const { data } = await http.get(routes.positions.list());
  return unwrapAny<Position[]>(data);
}

export async function getPosition(positionId: string): Promise<Position> {
  const { data } = await http.get(routes.positions.byId(positionId)); // /positions/:id
  return unwrapAny<Position>(data);
}

export async function getPositionsByBusinessUnit(
  businessUnitId: string
): Promise<Position[]> {
  const { data } = await http.get(routes.positions.list(), {
    params: { businessUnitId },
  });
  return unwrapAny<Position[]>(data);
}

export async function getPositionsByCompanyGrouped(
  companyId: string
): Promise<PositionsByCompanyGroupBU[]> {
  const res = await http.get(routes.positions.listByCompanyGrouped(companyId));
  return unwrapAny<PositionsByCompanyGroupBU[]>(res.data);
}

export async function createPosition(
  payload: CreatePositionPayload
): Promise<Position> {
  const { data } = await http.post(routes.positions.create(), payload);
  return unwrapAny<Position>(data);
}

export async function updatePosition(
  positionId: string,
  payload: UpdatePositionPayload
): Promise<Position> {
  const { data } = await http.patch(
    routes.positions.update(positionId),
    payload
  );
  return unwrapAny<Position>(data);
}

export async function inactivatePosition(
  positionId: string
): Promise<Position> {
  const { data } = await http.patch(routes.positions.update(positionId), {
    isActive: false,
  });
  return unwrapAny<Position>(data);
}
