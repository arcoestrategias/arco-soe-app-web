const KEYS = {
  accessToken: "soe.accessToken",
  refreshToken: "soe.refreshToken",
  businessUnitId: "soe.businessUnitId",
  companyId: "soe.companyId",
  positionId: "soe.positionId",
  strategicPlanId: "soe.strategicPlanId",
  buChangedAt: "soe.bu.changed.at",
} as const;

type KeyName = keyof typeof KEYS;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function get(key: KeyName): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(KEYS[key]);
  } catch {
    return null;
  }
}

function set(key: KeyName, value: string | null) {
  if (!isBrowser()) return;
  try {
    if (value === null) localStorage.removeItem(KEYS[key]);
    else localStorage.setItem(KEYS[key], value);
  } catch {}
}

function remove(key: KeyName) {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(KEYS[key]);
  } catch {}
}

// ------- Tokens (con caché en memoria pequeña) -------
let memAccess: string | null = null;
let memRefresh: string | null = null;

export function getAccessToken(): string | null {
  if (memAccess === null) memAccess = get("accessToken");
  return memAccess;
}

export function getRefreshToken(): string | null {
  if (memRefresh === null) memRefresh = get("refreshToken");
  return memRefresh;
}

export function setTokens(access: string | null, refresh: string | null) {
  memAccess = access ?? null;
  memRefresh = refresh ?? null;
  set("accessToken", access);
  set("refreshToken", refresh);
}

export function clearTokens() {
  memAccess = null;
  memRefresh = null;
  remove("accessToken");
  remove("refreshToken");
}

// ------- Business Unit -------
export function getBusinessUnitId(): string | null {
  return get("businessUnitId");
}

export function setBusinessUnitId(buId: string) {
  set("businessUnitId", buId);
}

export function clearBusinessUnit() {
  remove("businessUnitId");
}

// ------- Company -------
export function getCompanyId(): string | null {
  return get("companyId");
}

export function setCompanyId(companyId: string | null) {
  set("companyId", companyId);
}

export function clearSelectedCompanyId() {
  remove("companyId");
}

// ------- Position -------
export function getPositionId(): string | null {
  return get("positionId");
}

export function setPositionId(positionId: string | null) {
  set("positionId", positionId);
}

export function clearPositionId() {
  remove("positionId");
}

// ------- StrategicPlan -------
export function getStrategicPlanId(): string | null {
  return get("strategicPlanId");
}

export function setStrategicPlanId(strategicPlanId: string | null) {
  set("strategicPlanId", strategicPlanId);
}

export function clearStrategicPlanId() {
  remove("strategicPlanId");
}

// ------- Limpieza total de sesión (para logout) -------
export function clearAuthSession() {
  clearTokens();
  clearBusinessUnit();
  clearSelectedCompanyId();
  clearPositionId();
  clearStrategicPlanId();
}

// Exponemos KEYS por si quieres escuchar `storage` cross-tab en BU/Company/Position
export const AUTH_STORAGE_KEYS = KEYS;
