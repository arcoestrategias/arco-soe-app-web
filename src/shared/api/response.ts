import axios, { AxiosError, AxiosResponse } from "axios";

/** Envelope estándar del backend */
export type ApiEnvelope<T = unknown> = {
  success: boolean;
  message: string | string[] | Record<string, unknown>;
  statusCode: number;
  data: T;
  error?: unknown;
  errors?: unknown;
  path?: string;
};

export class ApiError extends Error {
  statusCode?: number;
  messages?: string[];
  raw?: unknown;

  constructor(
    message: string | string[] | Record<string, unknown>,
    statusCode?: number,
    raw?: unknown
  ) {
    const text = normalizeMessage(message) ?? "Operación no exitosa";
    super(text);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.messages = Array.isArray(message)
      ? message.map(String)
      : typeof message === "string"
      ? [message]
      : text
      ? [text]
      : [];
    this.raw = raw;
  }
}

/* ----------------------- helpers internos ----------------------- */

function isAxiosResponse(x: any): x is AxiosResponse {
  return (
    !!x &&
    typeof x === "object" &&
    "data" in x &&
    "status" in x &&
    "config" in x
  );
}

function isApiEnvelope(x: any): x is ApiEnvelope<any> {
  if (!x || typeof x !== "object") return false;
  // ser tolerantes: muchos backends siempre incluyen success/statusCode
  return "success" in x && "statusCode" in x && ("data" in x || "message" in x);
}

/** Convierte string | string[] | objeto {campo:[msgs]} en string amigable */
function normalizeMessage(msg: unknown): string | null {
  if (!msg) return null;
  if (Array.isArray(msg)) return msg.map(String).join("\n");
  if (typeof msg === "string") return msg;

  if (typeof msg === "object") {
    const parts: string[] = [];
    for (const [k, v] of Object.entries(msg as Record<string, unknown>)) {
      if (Array.isArray(v))
        parts.push(`${k}: ${(v as unknown[]).map(String).join(", ")}`);
      else parts.push(`${k}: ${String(v)}`);
    }
    return parts.join("\n");
  }
  return null;
}

/* ----------------------- API unwraps ----------------------- */

/**
 * Extrae el payload real desde:
 *  - AxiosResponse con envelope o payload plano
 *  - envelope directo
 *  - payload plano
 * Si success=false → lanza ApiError con los mensajes del back.
 */
export function unwrapAny<T = unknown>(resOrData: unknown): T {
  const body = isAxiosResponse(resOrData)
    ? (resOrData as AxiosResponse).data
    : resOrData;

  if (isApiEnvelope(body)) {
    const env = body as ApiEnvelope<T>;
    if (env.success) return (env.data ?? (undefined as any)) as T;

    // success=false
    throw new ApiError(env.message, env.statusCode, env);
  }

  // payload plano
  return body as T;
}

/**
 * Estricto: exige envelope. Si no es envelope o success=false, lanza.
 */
export function unwrap<T = unknown>(resOrEnv: unknown): T {
  const env = isAxiosResponse(resOrEnv)
    ? (resOrEnv as AxiosResponse).data
    : resOrEnv;

  if (!isApiEnvelope(env)) {
    throw new ApiError("Respuesta inválida del servidor (envelope ausente)");
  }
  if (!env.success) {
    throw new ApiError(env.message, env.statusCode, env);
  }
  return (env.data ?? (undefined as any)) as T;
}

/**
 * Devuelve payload o fallback si algo falla (envelope o plano).
 */
export function unwrapOrAny<T = unknown>(resOrData: unknown, fallback: T): T {
  try {
    return unwrapAny<T>(resOrData);
  } catch {
    return fallback;
  }
}

/**
 * Variante de unwrap estricto con fallback.
 */
export function unwrapOr<T = unknown>(resOrEnv: unknown, fallback: T): T {
  try {
    return unwrap<T>(resOrEnv);
  } catch {
    return fallback;
  }
}

/* ----------------------- errores amigables ----------------------- */

/**
 * Mensaje humano para toasts. Lee:
 *  - ApiError (nuestro)
 *  - AxiosError con envelope del backend
 *  - Error.message estándar
 */
export function getHumanErrorMessage(
  err: unknown,
  fallback = "Ocurrió un error"
): string {
  if (err instanceof ApiError) {
    return err.messages?.length
      ? err.messages.join("\n")
      : err.message || fallback;
  }

  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<any>;
    const data = ax.response?.data;

    if (isApiEnvelope(data)) {
      const msg = normalizeMessage((data as ApiEnvelope).message);
      return msg || fallback;
    }

    // Algunos backends usan { error: "..."} o { errors: {...} }
    const msg =
      normalizeMessage((data && (data.message as any)) ?? null) ||
      normalizeMessage((data && (data.error as any)) ?? null) ||
      normalizeMessage((data && (data.errors as any)) ?? null);

    return msg || ax.message || fallback;
  }

  if (err && typeof err === "object" && "message" in (err as any)) {
    return String((err as any).message) || fallback;
  }

  return fallback;
}
