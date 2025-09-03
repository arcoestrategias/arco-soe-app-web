// src/features/strategic-projects/hooks/use-projects-dashboard.ts
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import { getHumanErrorMessage } from "@/shared/api/response";
import { toast } from "sonner";
import { getStrategicProjectsDashboard } from "@/features/strategic-plans/services/strategicProjectsService";
import type { StrategicProjectsDashboardData } from "@/features/strategic-projects/types/dashboard";

export function useProjectsDashboard(planId?: string, positionId?: string) {
  const enabled = !!planId && !!positionId;

  const query = useQuery<StrategicProjectsDashboardData, unknown>({
    queryKey: QKEY.strategicProjectsDashboard(planId ?? "", positionId ?? ""),
    queryFn: () => getStrategicProjectsDashboard(planId!, positionId!),
    enabled,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.isError) {
      toast.error(getHumanErrorMessage(query.error));
    }
  }, [query.isError, query.error]);

  return {
    enabled,
    ...query,
  };
}
