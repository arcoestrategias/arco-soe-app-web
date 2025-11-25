import { useQuery } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import { strategyMapService } from "../services/strategyMapService";

/**
 * Hook para obtener los datos de los objetivos para el mapa estratégico.
 * @param strategicPlanId - El ID del plan estratégico.
 */
export function useStrategyMap(strategicPlanId: string | undefined) {
  const enabled = !!strategicPlanId;

  return useQuery({
    queryKey: QKEY.strategyMapObjectives(strategicPlanId as string),
    queryFn: () => strategyMapService.getStrategyMap(strategicPlanId as string),
    enabled,
    staleTime: 60_000, // Cache por 1 minuto, similar a otros hooks
  });
}