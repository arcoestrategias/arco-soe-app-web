// src/shared/api/http.ts
import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { routes } from "./routes";
import {
  clearTokens,
  getAccessToken,
  getBusinessUnitId,
  getRefreshToken,
  setTokens,
} from "../auth/storage";

/**
 * BASE_URL solo contiene dominio/host.
 * El prefijo (/api/v1) lo agrega routes.ts en cada endpoint.
 */
const apiPublic =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";

const apiInternal =
  process.env.API_BASE_URL_INTERNAL?.replace(/\/+$/, "") ?? "";

// SSR usa interna > pública > "/"; Cliente usa pública > "/"
const BASE_URL =
  typeof window === "undefined"
    ? apiInternal || apiPublic || "/"
    : apiPublic || "/";

export const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: new AxiosHeaders({
    "Content-Type": "application/json",
    Accept: "application/json",
  }),
  withCredentials: false, // true si usas cookies HttpOnly
});

/** Normaliza headers a AxiosHeaders */
function toAxiosHeaders(h?: unknown): AxiosHeaders {
  if (h instanceof AxiosHeaders) return h;
  return new AxiosHeaders(h as any);
}

/** Evita bucles de refresh en endpoints auth */
function isAuthUrl(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes(routes.auth.login()) ||
    url.includes(routes.auth.refresh()) ||
    url.includes(routes.auth.logout())
  );
}

/** Cola de refresh para concurrencia */
let isRefreshing = false;
let subscribers: Array<(token: string | null) => void> = [];

function subscribeRefresh(cb: (token: string | null) => void) {
  subscribers.push(cb);
}
function flushRefresh(err: unknown, token: string | null) {
  const pending = [...subscribers];
  subscribers = [];
  for (const cb of pending) {
    try {
      cb(token);
    } catch {
      // no-op
    }
  }
  if (err) console.error("[auth] refresh error:", err);
}

/** Refresh "en crudo", sin interceptores */
async function doRefresh(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const { data } = await axios.post(
      `${BASE_URL}${routes.auth.refresh()}`,
      { refreshToken: refresh },
      {
        timeout: 15000,
        withCredentials: false,
        headers: new AxiosHeaders({
          "Content-Type": "application/json",
          Accept: "application/json",
          "ngrok-skip-browser-warning": "true",
        }),
      }
    );

    const nextAccess: string | undefined =
      data?.data?.accessToken ?? data?.accessToken;
    const nextRefresh: string | undefined =
      data?.data?.refreshToken ?? data?.refreshToken ?? refresh;

    if (!nextAccess) return null;

    setTokens(nextAccess, nextRefresh ?? refresh);
    return nextAccess;
  } catch (e) {
    clearTokens();
    return null;
  }
}

/** Request: inyecta Authorization y BU */
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const headers = (config.headers = toAxiosHeaders(config.headers));

  const access = getAccessToken();
  if (access) headers.set("Authorization", `Bearer ${access}`);

  const bu = getBusinessUnitId();
  if (bu) headers.set("x-business-unit-id", bu);

  headers.set("ngrok-skip-browser-warning", "true");

  return config;
});

/** Response: refresh en 401 (sin tocar res.data) */
http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;

    if (!original || status !== 401) return Promise.reject(error);

    if (isAuthUrl(original.url)) {
      clearTokens();
      return Promise.reject(error);
    }
    if (original._retry) {
      clearTokens();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeRefresh((newToken) => {
          if (!newToken) return reject(error);
          original._retry = true;
          original.headers = toAxiosHeaders(original.headers);
          (original.headers as AxiosHeaders).set(
            "Authorization",
            `Bearer ${newToken}`
          );
          resolve(http(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const accessToken = await doRefresh();
      isRefreshing = false;
      flushRefresh(null, accessToken);

      if (!accessToken) {
        clearTokens();
        return Promise.reject(error);
      }

      original.headers = toAxiosHeaders(original.headers);
      (original.headers as AxiosHeaders).set(
        "Authorization",
        `Bearer ${accessToken}`
      );
      return http(original);
    } catch (err) {
      isRefreshing = false;
      flushRefresh(err, null);
      clearTokens();
      return Promise.reject(err);
    }
  }
);

/** Logging en desarrollo (no modifica res.data) */
// if (process.env.NODE_ENV === "development") {
//   http.interceptors.request.use((c) => {
//     console.log(
//       `[http:req] ${(c.method || "get").toUpperCase()} ${c.baseURL || ""}${
//         c.url || ""
//       }`
//     );
//     return c;
//   });
//   http.interceptors.response.use(
//     (r) => {
//       console.log(`[http:res] ${r.status} ${r.config.url}`);
//       return r;
//     },
//     (e) => {
//       console.log(`[http:err] ${e?.response?.status} ${e?.config?.url}`);
//       return Promise.reject(e);
//     }
//   );
// }

export default http;
