// import http from "@/shared/api/http";
// import { routes } from "@/shared/api/routes";
// import { unwrapAny } from "@/shared/api/response";

// export type NotificationPayload = {
//   codeTemplate: string;
//   to: string;
//   variables: Record<string, any>;
// };
// export async function sendNotification(payload: NotificationPayload) {
//   const res = await http.post(routes.notifications.send(), payload);
//   return unwrapAny<any>(res.data);
// }

import { http } from "@/shared/api/http";
import { routes } from "@/shared/api/routes";
import { unwrapAny } from "@/shared/api/response";
import {
  FilterNotificationsDto,
  PaginatedNotifications,
  Notification,
} from "../types/notification";

export const notificationsService = {
  // GET /notifications - lista
  async getNotifications(
    params: FilterNotificationsDto
  ): Promise<PaginatedNotifications> {
    const res = await http.get(routes.notifications.list(), { params });
    return unwrapAny<PaginatedNotifications>(res.data);
  },

  // CONTADOR DE NO LEÍDAS (usa el mismo endpoint filtrado)
  async getUnreadCount(): Promise<number> {
    const res = await http.get(routes.notifications.list(), {
      params: {
        status: "SENT",
        page: 1,
        pageSize: 1,
      },
    });

    const data = unwrapAny<PaginatedNotifications>(res.data);
    return data.total;
  },

  // PATCH /notifications/:id/read
  async markAsRead(id: string): Promise<Notification> {
    const res = await http.patch(routes.notifications.markRead(id));
    return unwrapAny<Notification>(res.data);
  },
};
