// src/features/notifications/hooks/use-notifications.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import { notificationsService } from "../services/notificationsService";
import {
  FilterNotificationsDto,
  PaginatedNotifications,
} from "../types/notification";
import { QKEY } from "@/shared/api/query-keys";

// 1) LISTAR NOTIFICACIONES
export function useNotifications(
  params: FilterNotificationsDto,
  enabled = true
) {
  return useQuery<PaginatedNotifications>({
    queryKey: [QKEY.notifications, params] as const,
    enabled,
    queryFn: () => notificationsService.getNotifications(params),
    placeholderData: keepPreviousData,
    refetchOnMount: "always",
  });
}

// 2) CONTADOR DE NO LEÍDAS (usa el mismo endpoint /notifications)
// Actualiza el contador cada 30 segundos
export function useUnreadNotificationsCount() {
  return useQuery<number>({
    queryKey: [QKEY.notificationsUnreadCount],
    queryFn: () => notificationsService.getUnreadCount(),
    staleTime: 0,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
}

// 3) MARCAR UNA COMO LEÍDA
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QKEY.notificationsUnreadCount] });
      qc.invalidateQueries({ queryKey: [QKEY.notifications] });
    },
  });
}

// 4) MARCAR TODAS COMO LEÍDAS
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => notificationsService.markAsRead(id)));
      return { count: ids.length };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QKEY.notificationsUnreadCount] });
      qc.invalidateQueries({ queryKey: [QKEY.notifications] });
    },
  });
}
