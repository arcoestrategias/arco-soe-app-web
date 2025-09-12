import { useQuery } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import { getOrgChartOverview } from "../services/org-chart-overview";

export function useOrgChartOverview(
  companyId?: string,
  businessUnitId?: string,
  strategicPlanId?: string,
  year?: number | string,
  month?: number | string,
  positionId?: string | null
) {
  const enabled =
    !!companyId &&
    !!businessUnitId &&
    !!strategicPlanId &&
    !!year &&
    month !== undefined &&
    month !== null &&
    month !== "";

  return useQuery({
    queryKey: QKEY.positionsOrgChartOverview(
      String(companyId ?? ""),
      String(businessUnitId ?? ""),
      String(strategicPlanId ?? ""),
      String(year ?? ""),
      String(month ?? ""),
      positionId ?? null
    ),
    queryFn: () =>
      getOrgChartOverview({
        companyId: companyId!,
        businessUnitId: businessUnitId!,
        strategicPlanId: strategicPlanId!,
        year: year!,
        month: month!,
        positionId: positionId ?? undefined,
      }),
    enabled,
  });
}
