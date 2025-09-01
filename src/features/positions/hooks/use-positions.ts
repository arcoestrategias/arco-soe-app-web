"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getHumanErrorMessage } from "@/shared/api/response";
import {
  createPosition,
  updatePosition,
  inactivatePosition,
} from "../services/positionsService";

export function usePositions() {
  const qc = useQueryClient();

  const fullCreatePosition = useMutation({
    mutationFn: createPosition,
    onSuccess: () => {
      qc.invalidateQueries(); // invalidamos listas relevantes
      toast.success("Posición creada");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const updatePositionMut = useMutation({
    mutationFn: (args: { id: string; data: any }) =>
      updatePosition(args.id, args.data),
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success("Posición actualizada");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const inactivatePositionMut = useMutation({
    mutationFn: (id: string) => inactivatePosition(id),
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success("Posición inactivada");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  return {
    fullCreatePosition,
    updatePosition: updatePositionMut,
    inactivatePosition: inactivatePositionMut,
  };
}
