"use client";
import { SidebarLayout } from "@/shared/layout";
import { CompaniesDashboard } from "@/features/companies/components/companies-dashboard";

const CompaniesPage = () => {
  return (
    <SidebarLayout currentPath="/companies" pageTitle="Empresas">
      <CompaniesDashboard />
    </SidebarLayout>
  );
};

export default CompaniesPage;
