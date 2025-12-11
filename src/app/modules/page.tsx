import { SidebarLayout } from "@/shared/layout/sidebar-layout";
import { ModulesDashboard } from "@/features/modules/components/modules-dashboard";

export default function ModulesPage() {
  return (
    <SidebarLayout pageTitle="Módulos del Sistema">
      <ModulesDashboard />
    </SidebarLayout>
  );
}
