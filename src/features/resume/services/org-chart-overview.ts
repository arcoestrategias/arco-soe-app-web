import { http } from "@/shared/api/http";
import { unwrapAny } from "@/shared/api/response";
import { routes } from "@/shared/api/routes";
import type { OrgChartOverviewResponse } from "../types/org-chart-overview";

export type GetOrgChartOverviewParams = {
  companyId: string;
  businessUnitId: string;
  strategicPlanId: string;
  year: number | string;
  month: number | string;
  positionId?: string | null;
};

export async function getOrgChartOverview(params: GetOrgChartOverviewParams) {
  const res = await http.get(routes.positions.orgChartOverview(), { params });
  return unwrapAny<OrgChartOverviewResponse>(res);
}
