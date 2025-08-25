"use client";

import { useState } from "react";
import type { SidebarLayoutProps } from "./types";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function SidebarLayout({
  children,
  currentPath,
  pageTitle = "Dashboard",
  onNavigate,
}: SidebarLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        currentPath={currentPath}
        onToggle={setIsCollapsed}
        onNavigate={onNavigate}
      />
      <Header currentPageTitle={pageTitle} isCollapsed={isCollapsed} />
      <main
        className={`pt-16 transition-all duration-300 ease-in-out ${
          isCollapsed ? "ml-[72px]" : "ml-64"
        }`}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
