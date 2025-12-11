import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import {
  getUserPermissions,
  updateUserPermissions,
  resetUserPermissions,
} from "../services/userPermissionsService";
import type { UpdateUserPermissionsPayload } from "../types/types";

export function useUserPermissionsQuery(
  businessUnitId: string,
  userId: string
) {
  return useQuery({
    queryKey: QKEY.userPermissions(businessUnitId, userId),
    queryFn: () => getUserPermissions(businessUnitId, userId),
    enabled: !!businessUnitId && !!userId,
  });
}

export function useUpdateUserPermissionsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      businessUnitId,
      userId,
      payload,
    }: {
      businessUnitId: string;
      userId: string;
      payload: UpdateUserPermissionsPayload;
    }) => updateUserPermissions(businessUnitId, userId, payload),
    onSuccess: (_, { businessUnitId, userId }) => {
      qc.invalidateQueries({
        queryKey: QKEY.userPermissions(businessUnitId, userId),
      });
    },
  });
}

export function useResetUserPermissionsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      businessUnitId,
      userId,
    }: {
      businessUnitId: string;
      userId: string;
    }) => resetUserPermissions(businessUnitId, userId),
    onSuccess: (_, { businessUnitId, userId }) => {
      qc.invalidateQueries({
        queryKey: QKEY.userPermissions(businessUnitId, userId),
      });
    },
  });
}
