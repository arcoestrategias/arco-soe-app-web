"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { navigationSections } from "@/shared/layout/navigation";
import type { SidebarProps } from "@/shared/layout/types";

export function Sidebar({
  currentPath,
  onLogout,
  onToggle,
  onNavigate,
}: SidebarProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const shouldShowExpanded = !isCollapsed || isHovered;

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) setIsCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    onToggle?.(isCollapsed);
  }, [isCollapsed]);

  const toggleCollapsed = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
    onToggle?.(next);
  };

  const handleClick = (url: string) => {
    router.push(url);
    onNavigate?.(url);
  };

  return (
    <TooltipProvider>
      <aside
        role="navigation"
        aria-label="Sidebar navigation"
        className={cn(
          "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-40 transition-all duration-300 ease-in-out overflow-hidden font-system",
          shouldShowExpanded ? "w-64" : "w-16"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded bg-gradient-to-r from-[#FF6B35] to-[#E55A2B] flex items-center justify-center text-white font-bold">
              S
            </div>
            <span
              className={cn(
                "transition-all duration-300 ease-in-out overflow-hidden",
                shouldShowExpanded
                  ? "opacity-100 w-auto ml-2"
                  : "opacity-0 w-0 ml-0"
              )}
            >
              SOE
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className={cn(
              "h-8 w-8 text-gray-400 hover:text-gray-600 transition-all duration-300 ease-in-out",
              shouldShowExpanded
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-4 pointer-events-none"
            )}
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform duration-300 ease-in-out",
                isCollapsed ? "-rotate-180" : "rotate-0"
              )}
            />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {navigationSections.map((section, i) => (
            <div
              key={section.title}
              className={cn("mb-6", i > 0 && "border-t pt-4 border-gray-100")}
            >
              <div
                className={cn(
                  "px-6 mb-3 transition-all duration-300 ease-in-out",
                  shouldShowExpanded
                    ? "opacity-100 h-auto"
                    : "opacity-0 h-0 overflow-hidden"
                )}
              >
                <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                  {section.title}
                </h3>
              </div>

              <div className="space-y-1 px-3">
                {section.items.map((item) => {
                  const isActive = currentPath?.startsWith(item.url);

                  return (
                    <div
                      key={item.title}
                      onClick={() => handleClick(item.url)}
                      className={cn(
                        "group flex items-center w-full cursor-pointer transition-all rounded-lg px-3 py-2.5",
                        isActive
                          ? "bg-orange-50 text-orange-600"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span
                        className={cn(
                          "transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
                          shouldShowExpanded
                            ? "opacity-100 ml-3 w-auto"
                            : "opacity-0 ml-0 w-0"
                        )}
                      >
                        {item.title}
                      </span>
                      {!shouldShowExpanded && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="absolute inset-0" />
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {item.title}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
