// src/shared/filters/storage.ts

/**
 * Storage de filtros (selects) a nivel de aplicación.
 * - Namespace base: "soe.filters"
 * - Claves planas (sin scoping por BU, sin legacy).
 *
 * Subkeys en este orden:
 *  1) businessUnitId
 *  2) strategicPlanId
 *  3) strategicProjectId
 *  4) positionId
 *
 * Ejemplos:
 *   setSelectedBusinessUnitId(buId)
 *   const buId = getSelectedBusinessUnitId()
 *   setSelectedPlanId(planId)
 *   const planId = getSelectedPlanId()
 *   clearFilters()
 */

//
// Constantes
//
const NAMESPACE = "soe.filters";

const SUBKEYS = {
  businessUnit: "businessUnitId",
  plan: "strategicPlanId",
  project: "strategicProjectId",
  position: "positionId",
} as const;

//
// LocalStorage seguro
//
function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function buildKey(subkey: string): string {
  return `${NAMESPACE}.${subkey}`;
}

function hasValue(v: string | null | undefined): v is string {
  return typeof v === "string" && v.length > 0;
}

//
// API genérica (get/set/clear)
//
/**
 * Lee un filtro (subkey) a nivel app.
 */
export function getFilter(subkey: string): string | null {
  const ls = getLocalStorage();
  if (!ls) return null;
  return ls.getItem(buildKey(subkey));
}

/**
 * Guarda un filtro (subkey) a nivel app.
 */
export function setFilter(subkey: string, value: string): void {
  const ls = getLocalStorage();
  if (!ls) return;
  ls.setItem(buildKey(subkey), value);
}

/**
 * Elimina un filtro (subkey) a nivel app.
 */
export function clearFilter(subkey: string): void {
  const ls = getLocalStorage();
  if (!ls) return;
  ls.removeItem(buildKey(subkey));
}

//
// API específica: Business Unit
//
export function getSelectedBusinessUnitId(): string | null {
  const ls = getLocalStorage();
  if (!ls) return null;
  const current = ls.getItem(buildKey(SUBKEYS.businessUnit));
  return hasValue(current) ? current! : null;
}

export function setSelectedBusinessUnitId(id: string): void {
  setFilter(SUBKEYS.businessUnit, id);
}

export function clearSelectedBusinessUnitId(): void {
  clearFilter(SUBKEYS.businessUnit);
}

//
// API específica: Strategic Plan
//
export function getSelectedPlanId(): string | null {
  const ls = getLocalStorage();
  if (!ls) return null;
  const current = ls.getItem(buildKey(SUBKEYS.plan));
  return hasValue(current) ? current! : null;
}

export function setSelectedPlanId(id: string): void {
  setFilter(SUBKEYS.plan, id);
}

export function clearSelectedPlanId(): void {
  clearFilter(SUBKEYS.plan);
}

//
// API específica: Strategic Project
//
export function getSelectedStrategicProjectId(): string | null {
  const ls = getLocalStorage();
  if (!ls) return null;
  const current = ls.getItem(buildKey(SUBKEYS.project));
  return hasValue(current) ? current! : null;
}

export function setSelectedStrategicProjectId(id: string): void {
  setFilter(SUBKEYS.project, id);
}

export function clearSelectedStrategicProjectId(): void {
  clearFilter(SUBKEYS.project);
}

//
// API específica: Position
//
export function getSelectedPositionId(): string | null {
  const ls = getLocalStorage();
  if (!ls) return null;
  const current = ls.getItem(buildKey(SUBKEYS.position));
  return hasValue(current) ? current! : null;
}

export function setSelectedPositionId(id: string): void {
  setFilter(SUBKEYS.position, id);
}

export function clearSelectedPositionId(): void {
  clearFilter(SUBKEYS.position);
}

//
// Utilidades
//
/**
 * Limpia TODOS los filtros conocidos (businessUnitId, strategicPlanId, strategicProjectId, positionId).
 */
export function clearFilters(): void {
  clearSelectedBusinessUnitId();
  clearSelectedPlanId();
  clearSelectedStrategicProjectId();
  clearSelectedPositionId();
}
