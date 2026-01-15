"use client";
import { SidebarLayout } from "@/shared/layout";
import { CompaniesDashboard } from "@/features/companies/components/companies-dashboard";
import { usePermission } from "@/shared/auth/access-control";
import { PERMISSIONS } from "@/shared/auth/permissions.constant";

const CompaniesPage = () => {
  const canRead = usePermission(PERMISSIONS.COMPANIES.READ);

  return (
    <SidebarLayout currentPath="/companies">
      {canRead ? (
        <CompaniesDashboard />
      ) : (
        <div className="p-6 text-center text-sm text-muted-foreground border rounded-md bg-gray-50 m-6">
          No tienes permisos para ver el módulo de compañías.
        </div>
      )}
    </SidebarLayout>
  );
};

export default CompaniesPage;
