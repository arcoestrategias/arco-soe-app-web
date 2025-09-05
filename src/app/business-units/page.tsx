"use client";

import { SidebarLayout } from "@/shared/layout";
import { BusinessUnitsDashboard } from "@/features/business-units/components/business-units-dashboard";

const BusinessUnitsPage = () => {
  return (
    <SidebarLayout currentPath="/business-units">
      <BusinessUnitsDashboard />
    </SidebarLayout>
  );
};

export default BusinessUnitsPage;
