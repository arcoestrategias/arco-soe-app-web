"use client";
import { SidebarLayout } from "@/shared/layout";
import { StrategicProjectsDashboard } from "@/features/strategic-projects/components";

export default function StrategicProjectsPage() {
  return (
    <SidebarLayout
      currentPath="/strategic-projects"
      pageTitle="Proyectos Estratégicos"
    >
      <StrategicProjectsDashboard />
    </SidebarLayout>
  );
}
