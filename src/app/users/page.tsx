"use client";

import { SidebarLayout } from "@/shared/layout";
import { UsersDashboard } from "@/features/users/components/users-dashboard";
import { usePermission } from "@/shared/auth/access-control";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";

export default function UsersPage() {
  const canRead = usePermission(PERMISSIONS.USERS.READ);

  return (
    <SidebarLayout currentPath="/users">
      {canRead ? (
        <UsersDashboard />
      ) : (
        <div className="p-6 text-center text-sm text-muted-foreground border rounded-md bg-gray-50 m-6">
          No tienes permisos para ver el módulo de usuarios.
        </div>
      )}
    </SidebarLayout>
  );
}
