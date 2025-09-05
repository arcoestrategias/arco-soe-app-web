import { useMemo } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";

export type PermissionAction =
  | "access"
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export"
  | "approve"
  | "assign";

type ModulePerms = Partial<Record<PermissionAction, boolean>>;
type ModulesMap = Record<string, ModulePerms>;

/** Extrae el mapa de módulos desde me.permissions.modules */
function getModules(me: any): ModulesMap {
  return (me?.permissions?.modules ?? {}) as ModulesMap;
}

/** Chequeo puro (fuera de React): ¿tiene acceso a module.action? */
export function hasAccess(
  me: any,
  moduleKey: string,
  action: PermissionAction = "access"
): boolean {
  if (me?.isPlatformAdmin) return true; // bypass total para admin
  const mod = getModules(me)[moduleKey];
  if (!mod) return false;
  return !!mod[action];
}

/** Hook para componentes React */
export function useAccess(
  moduleKey: string,
  action: PermissionAction = "access"
): boolean {
  const { me } = useAuth();
  return useMemo(
    () => hasAccess(me, moduleKey, action),
    [me, moduleKey, action]
  );
}

/** Componente declarativo para mostrar/ocultar por permiso */
export function ShowIfAccess(props: {
  module: string;
  action?: PermissionAction;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const ok = useAccess(props.module, props.action ?? "access");
  if (!ok) return <>{props.fallback ?? null}</>;
  return <>{props.children}</>;
}

/**
 * Como usar en botones o acciones:
import { ShowIfAccess, useAccess } from "@/features/auth/access-control";

<ShowIfAccess module="objective" action="delete">
  <Button onClick={onDelete}>Eliminar</Button>
</ShowIfAccess>

const canExport = useAccess("objective", "export");
<Button disabled={!canExport}>Exportar</Button>
 *
 */

/**
 * Como usar en Rutas o pagina completa:
<ShowIfAccess module="objective" action="access" fallback={<NoAccess />}>
  <ObjectivesPage />
</ShowIfAccess>
*/
