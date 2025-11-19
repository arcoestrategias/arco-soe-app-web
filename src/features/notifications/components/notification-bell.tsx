"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUnreadNotificationsCount } from "../hooks/use-notifications";
import { NotificationsPanel } from "./notifications-panel";
import { QKEY } from "@/shared/api/query-keys";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const qc = useQueryClient();

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;

      // Cuando pasas de cerrado -> abierto, fuerza refetch de todo lo relevante
      if (!prev && next) {
        qc.invalidateQueries({ queryKey: [QKEY.notificationsUnreadCount] });
        qc.invalidateQueries({ queryKey: [QKEY.notifications] });
      }

      return next;
    });
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={toggleOpen}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="default"
            className={cn(
              "absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full px-1 text-[10px] flex items-center justify-center"
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 z-50">
          <NotificationsPanel onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
