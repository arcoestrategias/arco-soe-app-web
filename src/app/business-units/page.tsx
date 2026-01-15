"use client";

import { SidebarLayout } from "@/shared/layout";
import { BusinessUnitsDashboard } from "@/features/business-units/components/business-units-dashboard";
import { usePermission } from "@/shared/auth/access-control";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";

const BusinessUnitsPage = () => {
  const canRead = usePermission(PERMISSIONS.BUSINESS_UNITS.READ);

  return (
    <SidebarLayout currentPath="/business-units">
      {canRead ? (
        <BusinessUnitsDashboard />
      ) : (
        <div className="p-6 text-center text-sm text-muted-foreground border rounded-md bg-gray-50 m-6">
          No tienes permisos para ver el módulo de unidades de negocio.
        </div>
      )}
    </SidebarLayout>
  );
};

export default BusinessUnitsPage;
