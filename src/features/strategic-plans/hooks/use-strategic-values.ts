"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getHumanErrorMessage } from "@/shared/api/response";
import { QKEY } from "@/shared/api/query-keys";
import {
  createStrategicValue,
  updateStrategicValue,
  reorderStrategicValues,
} from "../services/strategicValuesService";
import type {
  CreateStrategicValueBody,
  UpdateStrategicValuePayload,
  ReorderStrategicValuesPayload,
} from "../types/strategicValues";

export function useStrategicValues(strategicPlanId?: string) {
  const qc = useQueryClient();

  const invalidate = () => {
    if (strategicPlanId) {
      qc.invalidateQueries({ queryKey: QKEY.strategicValues(strategicPlanId) });
    }
  };

  // Crear (envía planId por query param + body con name/description/order)
  const createMut = useMutation({
    mutationFn: (body: CreateStrategicValueBody) => {
      if (!strategicPlanId) {
        return Promise.reject(new Error("strategicPlanId es requerido"));
      }
      return createStrategicValue({ strategicPlanId, body });
    },
    onSuccess: () => {
      invalidate();
      toast.success("Valor creado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  // Actualizar (también sirve para isActive=false)
  const updateMut = useMutation({
    mutationFn: (args: { id: string; data: UpdateStrategicValuePayload }) =>
      updateStrategicValue(args.id, args.data),
    onSuccess: () => {
      invalidate();
      toast.success("Valor actualizado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  // Reordenar (mismo shape que factores)
  const reorderMut = useMutation({
    mutationFn: (payload: ReorderStrategicValuesPayload) =>
      reorderStrategicValues(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Orden guardado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  return {
    createValue: createMut,
    updateValue: updateMut,
    reorderValues: reorderMut,
  };
}
