"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getHumanErrorMessage } from "@/shared/api/response";
import { QKEY } from "@/shared/api/query-keys";
import {
  createLever,
  updateLever,
  reorderLevers,
} from "../services/leversService";
import type {
  CreateLeverBody,
  UpdateLeverPayload,
  ReorderLeversPayload,
} from "../types/levers";
import { getPositionId } from "@/shared/auth/storage";

/**
 * Maneja creates/updates/reorder de Levers.
 * - Si no pasas positionId, usa el del localStorage (getPositionId()).
 */
export function useLevers(positionIdArg?: string) {
  const qc = useQueryClient();
  const positionId = positionIdArg ?? getPositionId();

  const invalidate = () => {
    if (positionId) {
      qc.invalidateQueries({ queryKey: QKEY.levers(positionId) });
    }
  };

  const createMut = useMutation({
    mutationFn: (body: CreateLeverBody) => {
      if (!positionId) {
        return Promise.reject(
          new Error("positionId es requerido (no se encontró en storage).")
        );
      }
      return createLever({ positionId, body });
    },
    onSuccess: () => {
      invalidate();
      toast.success("Palanca creada");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const updateMut = useMutation({
    mutationFn: (args: { id: string; data: UpdateLeverPayload }) =>
      updateLever(args.id, args.data),
    onSuccess: () => {
      invalidate();
      toast.success("Palanca actualizada");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const reorderMut = useMutation({
    mutationFn: (payload: ReorderLeversPayload) => reorderLevers(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Orden guardado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  return {
    createLever: createMut,
    updateLever: updateMut,
    reorderLevers: reorderMut,
  };
}
