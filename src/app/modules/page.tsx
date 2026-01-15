"use client";

import { SidebarLayout } from "@/shared/layout/sidebar-layout";
import { ModulesDashboard } from "@/features/modules/components/modules-dashboard";
import { usePermission } from "@/shared/auth/access-control";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";

export default function ModulesPage() {
  const canRead = usePermission(PERMISSIONS.MODULES.READ);

  return (
    <SidebarLayout pageTitle="Módulos del Sistema">
      {canRead ? (
        <ModulesDashboard />
      ) : (
        <div className="p-6 text-center text-sm text-muted-foreground border rounded-md bg-gray-50 m-6">
          No tienes permisos para ver el módulo de gestión de módulos.
        </div>
      )}
    </SidebarLayout>
  );
}
