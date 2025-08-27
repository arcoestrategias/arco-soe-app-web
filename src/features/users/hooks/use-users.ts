"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getHumanErrorMessage } from "@/shared/api/response";
import { QKEY } from "@/shared/api/query-keys";
import type {
  CreateUserAssignPayload,
  UpdateUserPayload,
  User,
} from "../types/types";
import {
  createUserAssign,
  getUsers,
  inactivateUser,
  updateUser,
} from "../services/usersService";

export function useUsers() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: QKEY.users,
    queryFn: getUsers,
  });
  const users = (data ?? []) as User[];

  const create = useMutation({
    mutationFn: (payload: CreateUserAssignPayload) => createUserAssign(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.users });
      toast.success("Usuario creado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e)),
  });

  const update = useMutation({
    mutationFn: (p: { id: string; data: UpdateUserPayload }) =>
      updateUser(p.id, p.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.users });
      toast.success("Usuario actualizado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => inactivateUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.users });
      toast.success("Usuario inactivado");
    },
    onError: (e) => toast.error(getHumanErrorMessage(e)),
  });

  return {
    users,
    isLoading,
    create: create.mutate,
    update: update.mutate,
    remove: remove.mutate,
  };
}
