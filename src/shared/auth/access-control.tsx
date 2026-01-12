import { useMemo } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";

// Interfaz mínima para el usuario (asegúrate de que tu tipo User en el AuthContext coincida)
export interface UserWithPermissions {
  isPlatformAdmin: boolean;
  permissions?: string[] | null;
}

/**
 * Chequeo puro (fuera de React): ¿tiene el usuario este permiso específico?
 * Útil para loaders, guards de rutas o funciones fuera de componentes.
 *
 * @param me Objeto del usuario actual
 * @param permission String del permiso (ej: 'users.create' o PERMISSIONS.USERS.CREATE)
 */
export function hasPermission(
  me: UserWithPermissions | null | undefined,
  permission: string
): boolean {
  // 1. Si no hay usuario, no hay permiso
  if (!me) return false;

  // 2. Si es Admin de Plataforma, tiene acceso total (bypass)
  if (me.isPlatformAdmin) return true;

  // 3. Validamos que exista el array de permisos
  const userPermissions = me.permissions;
  if (!Array.isArray(userPermissions)) {
    return false; // Si es null o undefined (ej. no ha seleccionado unidad), denegar.
  }

  // 4. Buscamos el permiso exacto en la lista plana
  return userPermissions.includes(permission);
}

/**
 * Verifica si el usuario tiene AL MENOS UNO de los permisos proporcionados.
 * Útil para lógica condicional donde varias credenciales permiten el acceso.
 */
export function hasAnyPermission(
  me: UserWithPermissions | null | undefined,
  permissions: string[]
): boolean {
  if (!me) return false;
  if (me.isPlatformAdmin) return true;

  const userPermissions = me.permissions;
  if (!Array.isArray(userPermissions)) return false;

  return permissions.some((p) => userPermissions.includes(p));
}

/**
 * Verifica si el usuario tiene TODOS los permisos proporcionados.
 * Útil para acciones estrictas que requieren múltiples validaciones.
 */
export function hasAllPermissions(
  me: UserWithPermissions | null | undefined,
  permissions: string[]
): boolean {
  if (!me) return false;
  if (me.isPlatformAdmin) return true;

  const userPermissions = me.permissions;
  if (!Array.isArray(userPermissions)) return false;

  return permissions.every((p) => userPermissions.includes(p));
}

/**
 * Hook para usar dentro de componentes React.
 * Reactivo a cambios en el usuario (me).
 */
export function usePermission(permission: string): boolean {
  const { me } = useAuth();
  return useMemo(() => hasPermission(me, permission), [me, permission]);
}

/**
 * Hook para validar si tiene ALGUNO de los permisos listados.
 */
export function useAnyPermission(permissions: string[]): boolean {
  const { me } = useAuth();
  // Serializamos permissions para evitar re-cálculos si el array cambia de referencia
  const key = permissions.join(",");
  return useMemo(
    () => hasAnyPermission(me, permissions),
    [me, key, permissions]
  ); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Componente declarativo para mostrar/ocultar contenido si tiene el permiso específico.
 */
export function ShowIfPermission(props: {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const canAccess = usePermission(props.permission);

  if (!canAccess) {
    return <>{props.fallback ?? null}</>;
  }

  return <>{props.children}</>;
}

/**
 * Componente declarativo para mostrar/ocultar contenido si tiene ALGUNO de los permisos.
 */
export function ShowIfAnyPermission(props: {
  permissions: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const canAccess = useAnyPermission(props.permissions);

  if (!canAccess) {
    return <>{props.fallback ?? null}</>;
  }

  return <>{props.children}</>;
}
