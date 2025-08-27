import http from "@/shared/api/http";
import { routes } from "@/shared/api/routes";
import { unwrapAny } from "@/shared/api/response";
import type { Role } from "./../../users/types/types";

export async function getRoles() {
  const res = await http.get(routes.roles.list());
  return unwrapAny<Role[]>(res.data);
}
