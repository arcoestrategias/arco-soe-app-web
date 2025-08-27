import http from "@/shared/api/http";
import { routes } from "@/shared/api/routes";
import { unwrapAny } from "@/shared/api/response";

export type SendNotificationPayload = {
  codeTemplate: string;
  to: string;
  variables: Record<string, any>;
};
export async function sendNotification(payload: SendNotificationPayload) {
  const res = await http.post(routes.notifications.send(), payload);
  return unwrapAny<any>(res.data);
}
