import { useQuery } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import { getOrgChartOverview } from "../services/org-chart-overview";

export function useOrgChartOverview(
  businessUnitId?: string,
  strategicPlanId?: string,
  year?: number | string,
  month?: number | string,
  positionId?: string | null
) {
  console.log({ businessUnitId, strategicPlanId, year, month });

  const enabled =
    !!businessUnitId &&
    !!strategicPlanId &&
    !!year &&
    month !== undefined &&
    month !== null &&
    month !== "";

  return useQuery({
    queryKey: QKEY.positionsOrgChartOverview(
      String(businessUnitId ?? ""),
      String(strategicPlanId ?? ""),
      String(year ?? ""),
      String(month ?? ""),
      positionId ?? null
    ),
    queryFn: () =>
      getOrgChartOverview({
        businessUnitId: businessUnitId!,
        strategicPlanId: strategicPlanId!,
        year: year!,
        month: month!,
        positionId: positionId ?? undefined,
      }),
    enabled,
  });
}
