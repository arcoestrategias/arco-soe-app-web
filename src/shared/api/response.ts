import type { AxiosResponse } from "axios";

export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  statusCode?: number;
  data?: T;
  error?: unknown;
  errors?: unknown;
  path?: string;
};

export class ApiError extends Error {
  statusCode?: number;
  details?: unknown;
  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

function pickData<T>(body: any): T {
  // 1) Envelope { data }
  if (body && typeof body === "object" && "data" in body) {
    return body.data as T;
  }
  // 2) Paginado { items, total }
  if (body && typeof body === "object" && "items" in body && "total" in body) {
    return body as T;
  }
  // 3) Payload plano (array/objeto)
  return body as T;
}

function pickStatus(body: any): number | undefined {
  if (body && typeof body === "object" && "statusCode" in body) {
    return body.statusCode as number;
  }
  return undefined;
}

function pickMessage(body: any): string | undefined {
  if (body && typeof body === "object" && "message" in body) {
    return body.message as string;
  }
  return undefined;
}

function pickSuccess(body: any): boolean | undefined {
  if (body && typeof body === "object" && "success" in body) {
    return body.success as boolean;
  }
  return undefined;
}

export function unwrapAny<T>(
  resOrEnv: AxiosResponse | ApiEnvelope<T> | any
): T {
  const body =
    "data" in (resOrEnv ?? {}) && "status" in (resOrEnv ?? {})
      ? (resOrEnv as AxiosResponse).data
      : resOrEnv;

  const status = pickStatus(body);
  const success = pickSuccess(body);

  if (typeof status === "number" && status >= 400) {
    throw new ApiError(
      pickMessage(body) ?? "Operación no exitosa",
      status,
      body?.error ?? body?.errors
    );
  }
  if (typeof success !== "undefined" && success === false) {
    throw new ApiError(
      pickMessage(body) ?? "Operación no exitosa",
      status,
      body?.error ?? body?.errors
    );
  }
  return pickData<T>(body);
}

export function unwrapOrAny<T>(
  resOrEnv: AxiosResponse | ApiEnvelope<T> | any,
  fallback: T
): T {
  try {
    return unwrapAny<T>(resOrEnv);
  } catch (e) {
    return fallback;
  }
}

export function getHumanErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message || "Operación no exitosa";
  if (err && typeof err === "object" && "message" in err)
    return (err as any).message || "Error";
  return "Algo salió mal";
}
