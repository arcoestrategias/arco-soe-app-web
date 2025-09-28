import http from "@/shared/api/http";
import { routes } from "@/shared/api/routes";
import { unwrapAny } from "@/shared/api/response";
import type {
  CommentNote,
  CreateCommentDto,
  UpdateCommentDto,
} from "../types/comment";

export async function getCommentsByReference(referenceId: string) {
  const res = await http.get(routes.comments.listByReference(referenceId));
  return unwrapAny<CommentNote[]>(res.data ?? res);
}

export async function createComment(payload: CreateCommentDto) {
  const res = await http.post(routes.comments.create(), payload);
  return unwrapAny<CommentNote>(res.data ?? res);
}

export async function updateComment(id: string, payload: UpdateCommentDto) {
  const res = await http.patch(routes.comments.update(id), payload);
  return unwrapAny<CommentNote>(res.data ?? res);
}

export async function inactivateComment(id: string) {
  const res = await http.patch(routes.comments.inactivate(id), {});
  // este endpoint no devuelve data, solo envelope ok
  return unwrapAny<{ success: true }>(res.data ?? res);
}
