"use client";

import { useQuery } from "@tanstack/react-query";
import { listFiles } from "@/shared/files/filesService";
import { QKEY } from "@/shared/api/query-keys";

/** Devuelve la URL pública de la foto del usuario (o null si no hay) */
export function useUserPhoto(userId?: string | null) {
  return useQuery({
    enabled: !!userId,
    queryKey: [QKEY.logo, userId],
    queryFn: async () => {
      const res = await listFiles("logo", userId!);
      return "publicUrl" in res ? (res.publicUrl as string | null) : null;
    },
    refetchOnWindowFocus: false,
  });
}
