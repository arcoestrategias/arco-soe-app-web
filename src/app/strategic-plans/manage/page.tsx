"use client";

import { SidebarLayout } from "@/shared/layout";
import { StrategicPlansDashboard } from "@/features/strategic-plans/components/manage/strategic-plans-dashboard";

const BusinessUnitsPage = () => {
  return (
    <SidebarLayout currentPath="/strategic-plans/manage">
      <StrategicPlansDashboard />
    </SidebarLayout>
  );
};

export default BusinessUnitsPage;
