"use client";

import { useQuery } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import { getUnconfiguredObjectives } from "../services/objectivesService";
import type { UnconfiguredObjective } from "../types/objectives";

export function useUnconfiguredObjectives(
  strategicPlanId?: string,
  positionId?: string
) {
  const enabled = !!strategicPlanId && !!positionId;

  const q = useQuery({
    queryKey: enabled
      ? QKEY.objectivesUnconfigured(strategicPlanId!, positionId!)
      : ["objectives-unconfigured", "disabled"],
    queryFn: () => getUnconfiguredObjectives(strategicPlanId!, positionId!),
    enabled,
    staleTime: 60_000,
  });

  return {
    items: (q.data ?? []) as UnconfiguredObjective[],
    isLoading: q.isPending,
    error: q.error,
    refetch: q.refetch,
  };
}
