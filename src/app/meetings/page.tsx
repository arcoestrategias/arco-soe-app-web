"use client";

import * as React from "react";
import { SidebarLayout } from "@/shared/layout";
import { MeetingsDashboard } from "@/features/meetings/components/meetings-dashboard";

export default function MeetingsPage() {
  return (
    <SidebarLayout currentPath="/meetings">
      <div className="space-y-6 font-system">
        <MeetingsDashboard />
      </div>
    </SidebarLayout>
  );
}
