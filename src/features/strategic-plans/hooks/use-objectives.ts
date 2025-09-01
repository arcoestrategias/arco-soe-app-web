"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QKEY } from "@/shared/api/query-keys";
import { getHumanErrorMessage } from "@/shared/api/response";
import {
  getObjectives,
  createObjective,
  updateObjective,
  reorderObjectives,
} from "../services/objectivesService";
import type {
  CreateObjectivePayload,
  UpdateObjectivePayload,
  ReorderObjectivesPayload,
  Objective,
} from "../types/objectives";

export function useObjectives(strategicPlanId?: string, positionId?: string) {
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: strategicPlanId
      ? QKEY.objectives(strategicPlanId, positionId!)
      : ["objectives", "disabled"],
    queryFn: () => getObjectives(strategicPlanId!, positionId!),
    enabled: !!strategicPlanId,
    staleTime: 60_000,
  });

  const createMut = useMutation({
    mutationFn: (payload: CreateObjectivePayload) => createObjective(payload),
    onSuccess: () => {
      if (strategicPlanId) {
        qc.invalidateQueries({
          queryKey: QKEY.objectives(strategicPlanId, positionId!),
        });
      }
      toast.success("Objetivo creado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const updateMut = useMutation({
    mutationFn: (args: { id: string; data: UpdateObjectivePayload }) =>
      updateObjective(args.id, args.data),
    onSuccess: () => {
      if (strategicPlanId) {
        qc.invalidateQueries({
          queryKey: QKEY.objectives(strategicPlanId, positionId!),
        });
      }
      toast.success("Objetivo actualizado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const reorderMut = useMutation({
    mutationFn: (payload: ReorderObjectivesPayload) =>
      reorderObjectives(payload),
    onSuccess: () => {
      if (strategicPlanId) {
        qc.invalidateQueries({
          queryKey: QKEY.objectives(strategicPlanId, positionId!),
        });
      }
      toast.success("Orden guardado exitosamente");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  return {
    // datos
    objectives: (listQuery.data ?? []) as Objective[],
    isLoading: listQuery.isPending,
    refetch: listQuery.refetch,

    // acciones
    createObjective: createMut.mutate,
    updateObjective: updateMut.mutate,
    reorderObjectives: reorderMut.mutate,

    // estados útiles
    isCreating: createMut.isPending,
    isUpdating: updateMut.isPending,
    isReordering: reorderMut.isPending,
  };
}
