import http from "@/shared/api/http";
import { unwrapAny } from "@/shared/api/response";
import { routes } from "@/shared/api/routes";

export interface ExternalUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export async function getExternalUsers(): Promise<ExternalUser[]> {
  const res = await http.get(routes.externalUsers.list());
  return unwrapAny<ExternalUser[]>(res.data);
}

export interface CreateExternalUserPayload {
  name: string;
  email: string;
}

export async function createExternalUser(
  payload: CreateExternalUserPayload
): Promise<ExternalUser> {
  const res = await http.post(routes.externalUsers.list(), payload);
  return unwrapAny<ExternalUser>(res.data);
}
