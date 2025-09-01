"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import { getPositionsByBusinessUnit } from "@/features/positions/services/positionsService";
import { useBusinessUnitUsers } from "@/features/business-units/hooks/use-business-unit-users";

export function useCeoPositionId(businessUnitId?: string) {
  // Usuarios de la BU (tu endpoint existente)
  const usersQ = useBusinessUnitUsers(businessUnitId);

  // Posiciones de la BU (para saber cuál es CEO)
  const positionsQ = useQuery({
    queryKey: businessUnitId
      ? QKEY.positionsByBU(businessUnitId)
      : ["positions", "bu", "disabled"],
    queryFn: () => getPositionsByBusinessUnit(businessUnitId!),
    enabled: !!businessUnitId,
    staleTime: 60_000,
  });

  const ceoPositionId = useMemo(() => {
    const positions = positionsQ.data ?? [];
    const ceoPositions = positions.filter((p: any) => p.isCeo);
    if (ceoPositions.length === 0) return undefined;

    const ceoIds = new Set(ceoPositions.map((p: any) => p.id));

    // Validamos si algún membership referencia esa posición
    const memberships = (usersQ.users ?? []).flatMap(
      (u: any) => u.userBusinessUnits ?? []
    );
    const match = memberships.find(
      (m: any) => m.positionId && ceoIds.has(m.positionId)
    );
    return match?.positionId ?? ceoPositions[0].id;
  }, [usersQ.users, positionsQ.data]);

  return {
    ceoPositionId,
    isLoading: usersQ.isLoading || positionsQ.isPending,
    error: usersQ.error ?? positionsQ.error,
  };
}
