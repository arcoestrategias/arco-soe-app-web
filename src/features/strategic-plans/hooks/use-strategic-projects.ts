"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getHumanErrorMessage } from "@/shared/api/response";
import {
  createStrategicProject,
  updateStrategicProject,
  setStrategicProjectActive,
  reorderStrategicProjects,
} from "../services/strategicProjectsService";
import { QKEY } from "@/shared/api/query-keys";
import type {
  CreateStrategicProjectPayload,
  UpdateStrategicProjectPayload,
  ReorderStrategicProjectsPayload,
} from "../types/strategicProjects";

export function useStrategicProjects(structuralKey?: {
  strategicPlanId: string;
  positionId: string;
}) {
  const qc = useQueryClient();

  const invalidate = () => {
    if (structuralKey) {
      qc.invalidateQueries({
        queryKey: QKEY.strategicProjects(
          structuralKey.strategicPlanId,
          structuralKey.positionId
        ),
      });
    } else {
      qc.invalidateQueries(); // fallback
    }
  };

  const createMut = useMutation({
    mutationFn: (payload: CreateStrategicProjectPayload) =>
      createStrategicProject(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Proyecto creado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const updateMut = useMutation({
    mutationFn: (args: { id: string; data: UpdateStrategicProjectPayload }) =>
      updateStrategicProject(args.id, args.data),
    onSuccess: () => {
      invalidate();
      toast.success("Proyecto actualizado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const setActiveMut = useMutation({
    mutationFn: (args: { id: string; isActive: boolean }) =>
      setStrategicProjectActive(args.id, { isActive: args.isActive }),
    onSuccess: () => {
      invalidate();
      toast.success("Estado actualizado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  const reorderMut = useMutation({
    mutationFn: (payload: ReorderStrategicProjectsPayload) =>
      reorderStrategicProjects(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Orden guardado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e as any)),
  });

  return {
    createProject: createMut,
    updateProject: updateMut,
    setProjectActive: setActiveMut,
    reorderProjects: reorderMut,
  };
}
