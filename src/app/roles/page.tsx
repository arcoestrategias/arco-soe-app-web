"use client";

import { SidebarLayout } from "@/shared/layout/sidebar-layout";
import { RolesDashboard } from "@/features/roles/components/roles-dashboard";
import { usePermission } from "@/shared/auth/access-control";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";

export default function RolesPage() {
  const canRead = usePermission(PERMISSIONS.ROLES.READ);

  return (
    <SidebarLayout pageTitle="Gestión de Roles">
      {canRead ? (
        <RolesDashboard />
      ) : (
        <div className="p-6 text-center text-sm text-muted-foreground border rounded-md bg-gray-50 m-6">
          No tienes permisos para ver el módulo de gestión de roles.
        </div>
      )}
    </SidebarLayout>
  );
}
