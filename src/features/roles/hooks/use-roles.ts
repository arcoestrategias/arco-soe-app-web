import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import {
  getRoles,
  createRole,
  updateRole,
  reactivateRole,
  inactivateRole,
  getRolePermissions,
  updateRolePermissions,
} from "../services/rolesService";
import type { CreateRolePayload, UpdateRolePayload } from "../types/types";

export function useRolesQuery(params?: { includeInactive: boolean }) {
  return useQuery({
    queryKey: QKEY.roles(params),
    queryFn: () => getRoles(params),
  });
}

export function useCreateRoleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => createRole(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY.roles() }),
  });
}

export function useUpdateRoleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRolePayload }) =>
      updateRole(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY.roles() }),
  });
}

export function useInactivateRoleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inactivateRole(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY.roles() }),
  });
}

export function useReactivateRoleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reactivateRole(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY.roles() }),
  });
}

// --- Hooks para Permisos de Roles ---

export function useRolePermissionsQuery(roleId: string | null) {
  return useQuery({
    queryKey: QKEY.rolePermissions(roleId!),
    queryFn: () => getRolePermissions(roleId!),
    enabled: !!roleId,
  });
}

export function useUpdateRolePermissionsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      roleId,
      payload,
    }: {
      roleId: string;
      payload: { permissions: { id: string; isActive: boolean }[] };
    }) => updateRolePermissions(roleId, payload),
    onSuccess: (_, { roleId }) =>
      qc.invalidateQueries({ queryKey: QKEY.rolePermissions(roleId) }),
  });
}
