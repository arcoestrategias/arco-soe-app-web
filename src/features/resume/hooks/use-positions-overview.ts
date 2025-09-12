import { useQuery } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import { getPositionsOverview } from "../services/positions-overview";

export function usePositionsOverview(
  businessUnitId?: string,
  strategicPlanId?: string,
  year?: number | string,
  month?: number | string,
  positionId?: string | null
) {
  const enabled =
    !!businessUnitId &&
    !!strategicPlanId &&
    !!year &&
    month !== undefined &&
    month !== null &&
    month !== "";

  return useQuery({
    queryKey: QKEY.positionsOverview(
      String(businessUnitId ?? ""),
      String(strategicPlanId ?? ""),
      String(year ?? ""),
      String(month ?? ""),
      positionId ?? null
    ),
    queryFn: () =>
      getPositionsOverview({
        businessUnitId: businessUnitId!,
        strategicPlanId: strategicPlanId!,
        year: year!,
        month: month!,
        positionId: positionId ?? undefined,
      }),
    enabled,
  });
}
