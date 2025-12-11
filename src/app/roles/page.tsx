import { SidebarLayout } from "@/shared/layout/sidebar-layout";
import { RolesDashboard } from "@/features/roles/components/roles-dashboard";

export default function ModulesPage() {
  return (
    <SidebarLayout pageTitle="Módulos del Sistema">
      <RolesDashboard />
    </SidebarLayout>
  );
}
