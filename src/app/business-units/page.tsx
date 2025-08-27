"use client";

import { SidebarLayout } from "@/shared/layout";
import { BusinessUnitsDashboard } from "@/features/business-units/components/business-units-dashboard";

const BusinessUnitsPage = () => {
  return (
    <SidebarLayout
      currentPath="/business-units"
      pageTitle="Unidades de Negocio"
    >
      <BusinessUnitsDashboard />
    </SidebarLayout>
  );
};

export default BusinessUnitsPage;
