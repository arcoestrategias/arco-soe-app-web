// src/shared/api/routes.ts

// Versión de API centralizada aquí
export const API_PREFIX = "/api/v1" as const;

// Sanitiza y une segmentos sin duplicar slashes
const join = (...parts: Array<string | number | undefined | null>) => {
  const raw = parts
    .filter((p): p is string | number => p !== undefined && p !== null)
    .map(String)
    .join("/");

  // Normaliza: un solo slash, y siempre empieza con "/"
  return ("/" + raw).replace(/\/{2,}/g, "/");
};

// Aplica el prefijo a una ruta relativa
const prefixed = (...parts: Array<string | number | undefined | null>) =>
  join(API_PREFIX, ...parts);

// Builder opcional de querystring
export const qs = (
  params?: Record<string, string | number | boolean | undefined | null>
) => {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null
  );
  if (!entries.length) return "";
  const search = new URLSearchParams();
  for (const [k, v] of entries) search.set(k, String(v));
  return `?${search.toString()}`;
};

// Módulos conocidos (literal-friendly)
export const Modules = {
  AUTH: "auth",
  USERS: "users",
  BUSINESS_UNITS: "business-units",
  PRIORITIES: "priorities",
  COMPANIES: "companies",
  // agrega aquí más módulos a futuro…
} as const;

// Rutas agrupadas
export const routes = {
  auth: {
    base: () => prefixed(Modules.AUTH),
    login: () => prefixed(Modules.AUTH, "login"),
    logout: () => prefixed(Modules.AUTH, "logout"),
    refresh: () => prefixed(Modules.AUTH, "refresh"),
  },

  companies: {
    base: () => prefixed(Modules.COMPANIES),
    list: () => prefixed(Modules.COMPANIES),
    byId: (id: string) => prefixed(Modules.COMPANIES, id),
    create: () => prefixed(Modules.COMPANIES),
    update: (id: string) => prefixed(Modules.COMPANIES, id),
    remove: (id: string) => prefixed(Modules.COMPANIES, id),
    fullCreate: () => prefixed(Modules.COMPANIES, "full-create"),
  },

  users: {
    base: () => prefixed(Modules.USERS),
    me: () => prefixed(Modules.USERS, "me"),
  },

  businessUnits: {
    base: () => prefixed(Modules.BUSINESS_UNITS),
    byId: (id: string) => prefixed(Modules.BUSINESS_UNITS, id),
    // si en algún momento tienes endpoints específicos, agrégalos aquí:
    // members: (id: string) => prefixed(Modules.BUSINESS_UNITS, id, "members"),
  },

  priorities: {
    base: () => prefixed(Modules.PRIORITIES),
    list: (params?: {
      month?: number;
      year?: number;
      positionId?: string;
      monthlyClass?: string;
    }) => prefixed(Modules.PRIORITIES) + qs(params),
    byId: (id: string) => prefixed(Modules.PRIORITIES, id),
  },
} as const;

// Helper opcional para crear módulos dinámicos
export const buildModule = (moduleName: string) => ({
  base: () => prefixed(moduleName),
  byId: (id: string) => prefixed(moduleName, id),
});
