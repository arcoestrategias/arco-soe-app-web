// features/objectives/hooks/use-ico-board.ts
import { useQuery } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import { getObjectivesIcoBoard } from "../services/objectivesIcoService";

export function useObjectivesIcoBoard(
  strategicPlanId: string | undefined,
  positionId: string | undefined,
  year: number | string | undefined
) {
  const fromYear = year;
  const toYear = year;

  const enabled =
    !!strategicPlanId &&
    !!positionId &&
    fromYear !== undefined &&
    fromYear !== null &&
    fromYear !== "" &&
    toYear !== undefined &&
    toYear !== null &&
    toYear !== "";

  return useQuery({
    queryKey: QKEY.objectivesIcoBoard(
      strategicPlanId ?? "",
      positionId ?? "",
      fromYear as number | string,
      toYear as number | string
    ),
    queryFn: () =>
      getObjectivesIcoBoard({
        strategicPlanId: strategicPlanId!,
        positionId: positionId!,
        fromYear: fromYear!,
        toYear: toYear!,
      }),
    enabled,
    // staleTime similar a priorities (si lo usas allí)
    // staleTime: 60_000,
  });
}
