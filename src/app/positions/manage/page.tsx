"use client";

import * as React from "react";
import { SidebarLayout } from "@/shared/layout";
import { PositionsDashboard } from "@/features/positions/components/manage/positions-dashboard";

export default function ManagePositionsPage() {
  return (
    <SidebarLayout
      currentPath="/manage-positions"
      pageTitle="Posiciones"
      onNavigate={() => {}}
    >
      <PositionsDashboard />
    </SidebarLayout>
  );
}
