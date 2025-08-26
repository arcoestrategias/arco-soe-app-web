import http from "@/shared/api/http";
import { routes } from "@/shared/api/routes";
import { unwrapAny } from "@/shared/api/response";
import type { UploadType, GetFilesData, PostFilesData } from "./types";

export async function listFiles(type: UploadType, referenceId: string) {
  const url = routes.files.byQuery({ type, referenceId });
  const res = await http.get(url);
  return unwrapAny<GetFilesData>(res);
}

export async function uploadFiles(
  type: UploadType,
  referenceId: string,
  files: File[],
  onProgress?: (pct: number) => void
) {
  const url = routes.files.byQuery({ type, referenceId });

  const form = new FormData();

  if (type === "logo") {
    const f = files[0];
    form.append("file", f, f.name);
  } else {
    for (const f of files) form.append("files", f, f.name);
  }

  const res = await http.post(url, form, {
    headers: { "Content-Type": "multipart/form-data" },

    onUploadProgress: (evt) => {
      if (!evt.total) return;
      onProgress?.(Math.round((evt.loaded / evt.total) * 100));
    },
    transformRequest: (data) => data,
  });

  return unwrapAny<PostFilesData>(res);
}
