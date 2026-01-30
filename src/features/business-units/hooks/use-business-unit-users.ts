"use client";

import { useQuery } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import {
  getBusinessUnitUsers,
  getBusinessUnitUsersNoPosition,
} from "../services/businessUnitsService";
import type { BusinessUnitUser } from "../types/business-unit-users";

export function useBusinessUnitUsers(businessUnitId?: string) {
  const query = useQuery({
    queryKey: businessUnitId
      ? QKEY.businessUnitUsers(businessUnitId)
      : ["business-unit", "users", "disabled"],
    queryFn: () => getBusinessUnitUsers(businessUnitId!),
    enabled: !!businessUnitId,
    staleTime: 60_000,
  });

  return {
    users: (query.data ?? []) as BusinessUnitUser[],
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useBusinessUnitUsersNoPosition(businessUnitId?: string) {
  const query = useQuery({
    queryKey: businessUnitId
      ? QKEY.businessUnitUsersNoPosition(businessUnitId)
      : ["business-unit", "users", "no-position", "disabled"],
    queryFn: () => getBusinessUnitUsersNoPosition(businessUnitId!),
    enabled: !!businessUnitId,
    staleTime: 60_000,
  });

  return {
    users: (query.data ?? []) as BusinessUnitUser[],
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}
