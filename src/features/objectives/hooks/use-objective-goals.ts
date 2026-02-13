import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { patchObjectiveGoal } from "../services/objectiveGoalsService";

type UpdateGoalInput = {
  id: string;
  realValue?: number | null;
  newGoalValue?: number | null; // ← viene desde la modal
  baseValue?: number | null;
  observation?: string | null; // ← viene desde la modal (obligatoria si cambió la meta)
};

export function useUpdateObjectiveGoal(invalidateKeys?: QueryKey[]) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      realValue,
      newGoalValue,
      baseValue,
      observation,
    }: UpdateGoalInput) =>
      patchObjectiveGoal(id, {
        realValue,
        goalValue: newGoalValue ?? undefined, // ← el backend recibe goalValue
        baseValue,
        observation,
      }),
    onSuccess: async () => {
      if (invalidateKeys?.length) {
        await Promise.all(
          invalidateKeys.map((k) =>
            qc.invalidateQueries({ queryKey: k, refetchType: "active" }),
          ),
        );
      }
    },
  });
}
