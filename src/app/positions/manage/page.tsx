"use client";

import * as React from "react";
import { SidebarLayout } from "@/shared/layout";
import { PositionsDashboard } from "@/features/positions/components/manage/positions-dashboard";
import { usePermission } from "@/shared/auth/access-control";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";

export default function ManagePositionsPage() {
  const canRead = usePermission(PERMISSIONS.POSITIONS.READ);

  return (
    <SidebarLayout currentPath="/positions/manage" onNavigate={() => {}}>
      {canRead ? (
        <PositionsDashboard />
      ) : (
        <div className="p-6 text-center text-sm text-muted-foreground border rounded-md bg-gray-50 m-6">
          No tienes permisos para ver el módulo de gestión de posiciones.
        </div>
      )}
    </SidebarLayout>
  );
}
