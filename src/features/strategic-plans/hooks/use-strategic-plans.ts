import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import {
  getStrategicPlans,
  createStrategicPlan,
  updateStrategicPlan,
  inactivateStrategicPlan,
  getStrategicPlan,
  getStrategicPlansByBusinessUnit,
} from "../services/strategicPlansService";

export function useStrategicPlans() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: QKEY.strategicPlans,
    queryFn: getStrategicPlans,
  });

  const { mutate: create } = useMutation({
    mutationFn: createStrategicPlan,
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY.strategicPlans }),
  });

  const { mutate: update } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateStrategicPlan(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY.strategicPlans }),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => inactivateStrategicPlan(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY.strategicPlans }),
  });

  return {
    strategicPlans: data ?? [],
    isLoading,
    create,
    update,
    remove,
  };
}

export function useStrategicPlansByBusinessUnit(businessUnitId?: string) {
  return useQuery({
    queryKey: QKEY.strategicPlansByBU(String(businessUnitId ?? "none")),
    queryFn: () =>
      businessUnitId
        ? getStrategicPlansByBusinessUnit(businessUnitId)
        : Promise.resolve([]),
    enabled: !!businessUnitId,
    staleTime: 60_000,
  });
}

export function useStrategicPlan(strategicPlanId?: string) {
  return useQuery({
    queryKey: QKEY.strategicPlan(String(strategicPlanId ?? "")),
    queryFn: () => getStrategicPlan(String(strategicPlanId)),
    enabled: !!strategicPlanId,
  });
}
