"use client";
import { useQuery } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import { getCompanyId } from "@/shared/auth/storage";
import { getPositionsByCompanyGrouped } from "../services/positionsService";

export function usePositionsByCompany() {
  const companyId = getCompanyId();
  return useQuery({
    queryKey: QKEY.companyPositionsGrouped(companyId ?? "none"),
    queryFn: () =>
      companyId ? getPositionsByCompanyGrouped(companyId) : Promise.resolve([]),
    enabled: !!companyId,
  });
}
