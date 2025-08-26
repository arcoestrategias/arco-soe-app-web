"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getHumanErrorMessage } from "@/shared/api/response";
import type {
  Company,
  CreateCompanyPayload,
  UpdateCompanyPayload,
} from "../types";
import {
  getCompanies,
  fullCreateCompany,
  updateCompany,
  inactivateCompany,
} from "../services/companiesService";
import { QKEY } from "@/shared/api/query-keys";

export function useCompanies() {
  const qc = useQueryClient();

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: QKEY.companies,
    queryFn: getCompanies,
    refetchOnWindowFocus: false,
  });

  const create = useMutation({
    mutationFn: (payload: CreateCompanyPayload) => fullCreateCompany(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.companies });
      toast.success("Empresa creada");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e)),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCompanyPayload }) =>
      updateCompany(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.companies });
      toast.success("Empresa actualizada");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e)),
  });

  const remove = useMutation({
    // 👇 eliminar = inactivar
    mutationFn: (id: string) => inactivateCompany(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.companies });
      toast.success("Empresa inactivada");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e)),
  });

  return {
    companies,
    isLoading,
    create: create.mutate,
    update: update.mutate,
    remove: remove.mutate,
  };
}
