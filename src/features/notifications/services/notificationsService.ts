import http from "@/shared/api/http";
import { routes } from "@/shared/api/routes";
import { unwrapAny } from "@/shared/api/response";

export type NotificationPayload = {
  codeTemplate: string;
  to: string;
  variables: Record<string, any>;
};
export async function sendNotification(payload: NotificationPayload) {
  const res = await http.post(routes.notifications.send(), payload);
  return unwrapAny<any>(res.data);
}
