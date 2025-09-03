import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import { getStrategicProjectStructure } from "@/features/strategic-plans/services/strategicProjectsService";
import { getHumanErrorMessage } from "@/shared/api/response";
import { toast } from "sonner";

export function useProjectStructure(projectId?: string) {
  const enabled = !!projectId;

  const query = useQuery({
    queryKey: QKEY.strategicProjectStructure(projectId ?? ""),
    queryFn: () => getStrategicProjectStructure(projectId!),
    enabled,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.isError) toast.error(getHumanErrorMessage(query.error));
  }, [query.isError, query.error]);

  return { enabled, ...query };
}
