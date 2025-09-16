import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { patchObjectiveGoal } from "../services/objectiveGoalsService";

export function useUpdateObjectiveGoal(invalidateKeys?: QueryKey[]) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, realValue }: { id: string; realValue: number | null }) =>
      patchObjectiveGoal(id, { realValue }),

    onSuccess: async () => {
      if (invalidateKeys?.length) {
        await Promise.all(
          invalidateKeys.map((k) =>
            qc.invalidateQueries({ queryKey: k, refetchType: "active" })
          )
        );
      }
    },
  });
}
