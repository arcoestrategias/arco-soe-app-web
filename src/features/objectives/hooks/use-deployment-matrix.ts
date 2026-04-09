import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import {
  getDeploymentMatrixData,
  getCollaborationsData,
  assignResponsibility,
  deleteResponsibility,
} from "../services/deploymentMatrixService";

export function useDeploymentMatrix(
  planId?: string,
  positionId?: string,
  year?: number | string,
) {
  return useQuery({
    queryKey: [...QKEY.deploymentMatrix(planId ?? "", positionId ?? ""), year],
    queryFn: () => getDeploymentMatrixData(planId!, positionId!, year),
    // Solo ejecutamos si ambos IDs existen
    enabled: !!planId && !!positionId,
    // Configuramos un staleTime razonable (opcional)
    staleTime: 60_000,
  });
}

export function useCollaborations(
  planId?: string,
  positionId?: string,
  year?: number | string,
) {
  return useQuery({
    queryKey: [...QKEY.collaborations(planId ?? "", positionId ?? ""), year],
    queryFn: () => getCollaborationsData(planId!, positionId!, year),
    enabled: !!planId && !!positionId,
    staleTime: 60_000,
  });
}

export function useAssignResponsibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assignResponsibility,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["objectives", "deployment-matrix"] });
      qc.invalidateQueries({ queryKey: ["objectives", "collaborations"] });
    },
  });
}

export function useDeleteResponsibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteResponsibility,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["objectives", "deployment-matrix"] });
      qc.invalidateQueries({ queryKey: ["objectives", "collaborations"] });
    },
  });
}
