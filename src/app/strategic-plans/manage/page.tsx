"use client";

import { SidebarLayout } from "@/shared/layout";
import { StrategicPlansDashboard } from "@/features/strategic-plans/components/manage/strategic-plans-dashboard";
import { usePermission } from "@/shared/auth/access-control";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";

const BusinessUnitsPage = () => {
  const canRead = usePermission(PERMISSIONS.STRATEGIC_PLANS.READ);

  return (
    <SidebarLayout currentPath="/strategic-plans/manage">
      {canRead ? (
        <StrategicPlansDashboard />
      ) : (
        <div className="p-6 text-center text-sm text-muted-foreground border rounded-md bg-gray-50 m-6">
          No tienes permisos para ver el módulo de gestión de planes
          estratégicos.
        </div>
      )}
    </SidebarLayout>
  );
};

export default BusinessUnitsPage;
