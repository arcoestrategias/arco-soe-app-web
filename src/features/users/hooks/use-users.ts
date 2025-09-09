// src/features/users/hooks/use-users.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getHumanErrorMessage } from "@/shared/api/response";
import { QKEY } from "@/shared/api/query-keys";
import type {
  CompanyUsersGroupedByBU,
  CreateUserAssignPayload,
  UpdateUserPayload,
} from "../types/types";
import {
  createUserAssign,
  getCompanyUsersGrouped,
  inactivateUser,
  updateUser,
} from "../services/usersService";
import { getCompanyId } from "@/shared/auth/storage";

export function useUsers() {
  const qc = useQueryClient();
  const companyId = getCompanyId();

  const groupsQuery = useQuery({
    queryKey: QKEY.companyUsersGrouped(companyId || "none"),
    queryFn: () => {
      if (!companyId) return Promise.resolve([] as CompanyUsersGroupedByBU[]);
      return getCompanyUsersGrouped(companyId);
    },
    enabled: !!companyId,
  });

  const invalidateLists = () => {
    if (companyId) {
      qc.invalidateQueries({ queryKey: QKEY.companyUsersGrouped(companyId) });
    }
  };

  const create = useMutation({
    mutationFn: (payload: CreateUserAssignPayload) => createUserAssign(payload),
    onSuccess: () => {
      invalidateLists();
      toast.success("Usuario creado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e)),
  });

  const update = useMutation({
    mutationFn: (p: { id: string; data: UpdateUserPayload }) =>
      updateUser(p.id, p.data),
    onSuccess: () => {
      invalidateLists();
      toast.success("Usuario actualizado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => inactivateUser(id),
    onSuccess: () => {
      invalidateLists();
      toast.success("Usuario inactivado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e)),
  });

  const groups = groupsQuery.data ?? [];
  const total = groups.reduce((acc, g) => acc + (g.users?.length ?? 0), 0) ?? 0;

  return {
    groups,
    total,
    isLoading: groupsQuery.isLoading,
    refetch: groupsQuery.refetch,
    create: create.mutate,
    update: update.mutate,
    remove: remove.mutate,
  };
}
