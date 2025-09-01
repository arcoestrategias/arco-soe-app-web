// features/priorities/hooks/use-priorities.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import { prioritiesService } from "../services/prioritiesService";
import type {
  FilterPriorityDto,
  CreatePriorityDto,
  UpdatePriorityDto,
  ToggleActivePriorityDto,
} from "../types/priority";

/** Lista de prioridades por Position-Month-Year (PMY) */
export function usePriorities(filters: FilterPriorityDto, enabled = true) {
  const {
    positionId,
    month,
    year,
    page = 1,
    limit = 1000,
    status,
    objectiveId,
    monthlyClass,
  } = filters ?? {};

  return useQuery({
    queryKey: QKEY.prioritiesByPMY(
      positionId as string,
      month as number,
      year as number,
      page,
      limit,
      status,
      objectiveId,
      monthlyClass
    ),
    queryFn: () => prioritiesService.getPriorities(filters),
    enabled: enabled && !!positionId && !!month && !!year,
    staleTime: 30_000,
  });
}

/** Crear prioridad — invalida la key visible si se provee */
export function useCreatePriority(invalidateKey?: readonly unknown[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePriorityDto) =>
      prioritiesService.createPriority(payload),
    onSuccess: () => {
      if (invalidateKey) qc.invalidateQueries({ queryKey: invalidateKey });
      else qc.invalidateQueries({ queryKey: QKEY.priorities });
    },
  });
}

/** Actualizar prioridad — invalida la key visible si se provee */
export function useUpdatePriority(invalidateKey?: readonly unknown[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePriorityDto }) =>
      prioritiesService.updatePriority(id, payload),
    onSuccess: () => {
      if (invalidateKey) qc.invalidateQueries({ queryKey: invalidateKey });
      else qc.invalidateQueries({ queryKey: QKEY.priorities });
    },
  });
}

/** Activar/Inactivar prioridad — invalida la key visible si se provee */
export function useToggleActivePriority(invalidateKey?: readonly unknown[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ToggleActivePriorityDto;
    }) => prioritiesService.setPriorityActive(id, payload),
    onSuccess: () => {
      if (invalidateKey) qc.invalidateQueries({ queryKey: invalidateKey });
      else qc.invalidateQueries({ queryKey: QKEY.priorities });
    },
  });
}

export function usePrioritiesIcpSeries(
  params: { positionId?: string; from: string; to: string },
  enabled: boolean
) {
  const { positionId, from, to } = params;

  // Mantén SIEMPRE la misma forma del key (tuple de 5 elementos)
  const queryKey = QKEY.prioritiesIcpSeries(positionId ?? "disabled", from, to);

  return useQuery({
    queryKey,
    enabled: enabled && !!positionId,
    queryFn: () =>
      prioritiesService.icpSeries({
        positionId: positionId!, // safe por enabled
        from,
        to,
      }),
    staleTime: 60_000,
    // v5: reemplaza keepPreviousData: true
    placeholderData: keepPreviousData,
  });
}
