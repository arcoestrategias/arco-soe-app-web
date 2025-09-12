import { http } from "@/shared/api/http";
import { unwrapAny } from "@/shared/api/response";
import { routes } from "@/shared/api/routes";
import type { PositionsOverviewResponse } from "../types/positions-overview";

type GetPositionsOverviewParams = {
  businessUnitId: string;
  strategicPlanId: string;
  year: number | string;
  month: number | string;
  positionId?: string | null;
};

export async function getPositionsOverview(params: GetPositionsOverviewParams) {
  const { positionId, ...rest } = params;

  // solo mandamos positionId si viene definido
  const res = await http.get(routes.positions.overview(), {
    params: positionId ? { ...rest, positionId } : rest,
  });

  return unwrapAny<PositionsOverviewResponse>(res);
}
