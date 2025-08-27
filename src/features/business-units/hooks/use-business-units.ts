"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getHumanErrorMessage } from "@/shared/api/response";
import { QKEY } from "@/shared/api/query-keys";
import type {
  BusinessUnit,
  CreateBusinessUnitPayload,
  UpdateBusinessUnitPayload,
} from "../types";
import {
  getBusinessUnits,
  createBusinessUnit,
  updateBusinessUnit,
  inactivateBusinessUnit,
} from "../services/businessUnitsService";

export function useBusinessUnits() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: QKEY.businessUnits,
    queryFn: getBusinessUnits,
  });

  const businessUnits = (data ?? []) as BusinessUnit[];

  const create = useMutation({
    mutationFn: (payload: CreateBusinessUnitPayload) =>
      createBusinessUnit(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.businessUnits });
      toast.success("Unidad de negocio creada");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e)),
  });

  const update = useMutation({
    mutationFn: (p: { id: string; data: UpdateBusinessUnitPayload }) =>
      updateBusinessUnit(p.id, p.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.businessUnits });
      toast.success("Unidad de negocio actualizada");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => inactivateBusinessUnit(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.businessUnits });
      toast.success("Unidad de negocio inactivada");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e)),
  });

  return {
    businessUnits,
    isLoading,
    create: create.mutate,
    update: update.mutate,
    remove: remove.mutate,
  };
}
