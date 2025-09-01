"use client";

import { SidebarLayout } from "@/shared/layout";
import { StrategicPlansDashboard } from "@/features/strategic-plans/components/manage/strategic-plans-dashboard";

const BusinessUnitsPage = () => {
  return (
    <SidebarLayout
      currentPath="/manage-strategic-plans"
      pageTitle="Planes Estrategicos"
    >
      <StrategicPlansDashboard />
    </SidebarLayout>
  );
};

export default BusinessUnitsPage;
