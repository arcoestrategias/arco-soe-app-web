import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import {
  getStrategicSuccessFactors,
  createStrategicSuccessFactor,
  updateStrategicSuccessFactor,
  reorderStrategicSuccessFactors,
} from "../services/strategicSuccessFactorsService";
import type {
  CreateStrategicSuccessFactorPayload,
  UpdateStrategicSuccessFactorPayload,
  ReorderStrategicSuccessFactorsPayload,
  StrategicSuccessFactor,
} from "../types/types";

export function useStrategicSuccessFactors(
  strategicPlanId: string | undefined
) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: strategicPlanId
      ? QKEY.strategicSuccessFactors(strategicPlanId)
      : ["strategic-success-factors", "disabled"],
    queryFn: () => getStrategicSuccessFactors(strategicPlanId as string),
    enabled: !!strategicPlanId,
  });

  const { mutate: create } = useMutation({
    mutationFn: (payload: CreateStrategicSuccessFactorPayload) =>
      createStrategicSuccessFactor(payload),
    onSuccess: () => {
      if (strategicPlanId) {
        qc.invalidateQueries({
          queryKey: QKEY.strategicSuccessFactors(strategicPlanId),
        });
      }
    },
  });

  const { mutate: update } = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateStrategicSuccessFactorPayload;
    }) => updateStrategicSuccessFactor(id, data),
    onSuccess: () => {
      if (strategicPlanId) {
        qc.invalidateQueries({
          queryKey: QKEY.strategicSuccessFactors(strategicPlanId),
        });
      }
    },
  });

  const { mutate: reorder } = useMutation({
    mutationFn: (payload: ReorderStrategicSuccessFactorsPayload) =>
      reorderStrategicSuccessFactors(payload),
    onSuccess: () => {
      if (strategicPlanId) {
        qc.invalidateQueries({
          queryKey: QKEY.strategicSuccessFactors(strategicPlanId),
        });
      }
    },
  });

  return {
    factors: (data as StrategicSuccessFactor[]) ?? [],
    isLoading,
    create, // mutate(payload)
    update, // mutate({ id, data })
    reorder, // mutate(payload)
  };
}
