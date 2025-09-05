"use client";

import { useState } from "react";
import type { SidebarLayoutProps } from "./types";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function SidebarLayout({
  children,
  currentPath,
  pageTitle,
  onNavigate,
}: SidebarLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-svh overflow-hidden bg-gray-50">
      <Sidebar
        currentPath={currentPath}
        onToggle={setIsCollapsed}
        onNavigate={onNavigate}
      />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <Header currentPageTitle={pageTitle} isCollapsed={isCollapsed} />
        <main
          className={`
            transition-all duration-300 ease-in-out
            ${isCollapsed ? "ml-[72px]" : "ml-64"}
            pt-16 h-full overflow-y-auto
          `}
        >
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
