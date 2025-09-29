"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getHumanErrorMessage } from "@/shared/api/response";
import { toast } from "sonner";
import { inactivateObjective } from "../services/objectivesService";
import { QKEY } from "@/shared/api/query-keys";
import { InactivateObjectiveResult } from "@/features/objectives/types/inactivate";

export function useInactivateObjective(
  invalidateKeys?: readonly (readonly unknown[])[]
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inactivateObjective(id),
    onError: (e) => toast.error(getHumanErrorMessage(e)),
    onSuccess: async (data) => {
      if (!data.blocked) {
        if (invalidateKeys?.length) {
          await Promise.all(
            invalidateKeys.map((key) => qc.invalidateQueries({ queryKey: key }))
          );
        } else {
          await qc.invalidateQueries({ queryKey: ["objectives"] });
        }
        toast.success("Objetivo inactivado");
      }
    },
  });
}
