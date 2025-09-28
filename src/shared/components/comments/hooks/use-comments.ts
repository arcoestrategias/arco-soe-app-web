"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QKEY } from "@/shared/api/query-keys";
import { getHumanErrorMessage } from "@/shared/api/response";
import {
  getCommentsByReference,
  createComment,
  updateComment,
  inactivateComment,
} from "../services/commentsService";
import type {
  CreateCommentDto,
  UpdateCommentDto,
  CommentNote,
} from "../types/comment";

export function useComments(referenceId?: string) {
  return useQuery({
    queryKey: QKEY.commentsByReference(String(referenceId ?? "none")),
    queryFn: () =>
      referenceId
        ? getCommentsByReference(referenceId)
        : Promise.resolve<CommentNote[]>([]),
    enabled: !!referenceId,
    staleTime: 60_000,
  });
}

export function useCreateComment(invalidateKey?: readonly unknown[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCommentDto) => createComment(dto),
    onError: (e) => toast.error(getHumanErrorMessage(e)),
    onSuccess: async () => {
      if (invalidateKey)
        await qc.invalidateQueries({ queryKey: invalidateKey });
      else await qc.invalidateQueries({ queryKey: QKEY.comments });
      toast.success("Nota creada exitosamente");
    },
  });
}

export function useUpdateComment(invalidateKey?: readonly unknown[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; payload: UpdateCommentDto }) =>
      updateComment(args.id, args.payload),
    onError: (e) => toast.error(getHumanErrorMessage(e)),
    onSuccess: async () => {
      if (invalidateKey)
        await qc.invalidateQueries({ queryKey: invalidateKey });
      else await qc.invalidateQueries({ queryKey: QKEY.comments });
      toast.success("Nota actualizada correctamente");
    },
  });
}

export function useInactivateComment(invalidateKey?: readonly unknown[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inactivateComment(id),
    onError: (e) => toast.error(getHumanErrorMessage(e)),
    onSuccess: async () => {
      if (invalidateKey)
        await qc.invalidateQueries({ queryKey: invalidateKey });
      else await qc.invalidateQueries({ queryKey: QKEY.comments });
      toast.success("Nota eliminada");
    },
  });
}
