"use client";

import { SidebarLayout } from "@/shared/layout";
import { UsersDashboard } from "@/features/users/components/users-dashboard";

export default function UsersPage() {
  return (
    <SidebarLayout currentPath="/users">
      <UsersDashboard />
    </SidebarLayout>
  );
}
