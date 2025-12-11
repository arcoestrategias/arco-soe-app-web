import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import {
  getModules,
  getModulePermissions,
  syncModulePermissions,
  type SyncModulePermissionsPayload,
} from "../services/modulesService";

export function useModulesQuery() {
  return useQuery({
    queryKey: QKEY.modules(),
    queryFn: getModules,
  });
}

export function useModulePermissionsQuery(moduleId: string | null) {
  return useQuery({
    queryKey: QKEY.modulePermissions(moduleId!),
    queryFn: () => getModulePermissions(moduleId!),
    enabled: !!moduleId, // El query solo se ejecutará si moduleId no es nulo
  });
}

export function useSyncModulePermissionsMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      moduleId,
      payload,
    }: {
      moduleId: string;
      payload: SyncModulePermissionsPayload;
    }) => syncModulePermissions(moduleId, payload),
    onSuccess: (_, { moduleId }) => {
      // Invalida la query de permisos para este módulo para que se refresque con los nuevos datos
      return qc.invalidateQueries({
        queryKey: QKEY.modulePermissions(moduleId),
      });
    },
  });
}
