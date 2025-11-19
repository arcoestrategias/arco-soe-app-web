// src/features/notifications/components/notifications-panel.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FilterNotificationsDto, Notification } from "../types/notification";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface NotificationsPanelProps {
  onClose?: () => void;
}

const DEFAULT_FILTER: FilterNotificationsDto = {
  page: 1,
  pageSize: 10,
  status: "SENT",
};

export function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const [filters] = useState<FilterNotificationsDto>(DEFAULT_FILTER);
  const router = useRouter();

  const { data, isLoading } = useNotifications(filters);
  const { mutate: markRead, isPending: isMarking } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } =
    useMarkAllNotificationsRead();

  const items = data?.items ?? [];

  const handleClickItem = (notif: Notification) => {
    if (notif.status === "SENT" && !isMarking) {
      markRead(notif.id);
    }

    // if (notif.entityType === "PRIORITY" && notif.entityId) {
    //   router.push(`/priorities/${notif.entityId}`);
    //   if (onClose) onClose();
    // }
    // En el futuro: otros entityType → otras rutas
  };

  const handleMarkAllRead = () => {
    const ids = items.filter((n) => n.status === "SENT").map((n) => n.id);

    if (!ids.length || isMarkingAll) return;

    markAllRead(ids);
  };

  return (
    <div className="rounded-lg border bg-background shadow-lg">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="text-sm font-semibold">Notificaciones</div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={!items.length || isMarkingAll}
            onClick={handleMarkAllRead}
          >
            {isMarkingAll ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Marcando...
              </>
            ) : (
              "Marcar todas como leídas"
            )}
          </Button>
        </div>
      </div>

      <div className="h-80">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !items.length ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground px-4 text-center">
            No tienes notificaciones por el momento.
          </div>
        ) : (
          <ScrollArea className="h-80">
            <ul className="divide-y">
              {items.map((notif) => (
                <li
                  key={notif.id}
                  className={cn(
                    "px-3 py-2 text-xs cursor-pointer hover:bg-muted/60 transition-colors",
                    notif.status === "SENT" && "bg-muted/40 font-semibold"
                  )}
                  onClick={() => handleClickItem(notif)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold">
                          {notif.title}
                        </span>
                        {notif.status === "SENT" && (
                          <span className="inline-flex h-2 w-2 rounded-full bg-primary"></span>
                        )}
                      </div>
                      {notif.message && (
                        <div className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                          {notif.message}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {notif.sentAt && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(notif.sentAt), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      )}
                      <Badge
                        variant={mapEventToVariant(notif.event)}
                        className="text-[9px] px-1 py-0 h-4"
                      >
                        {mapEventToLabel(notif.event)}
                      </Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

function mapEventToLabel(event: Notification["event"]): string {
  switch (event) {
    case "ASSIGNED":
      return "Asignado";
    case "UPDATED":
      return "Actualizado";
    case "REOPENED":
      return "Reabierto";
    case "COMPLETED":
      return "Completado";
    case "DUE_SOON":
      return "Próximo a vencer";
    case "OVERDUE":
      return "Vencido";
    case "APPROVAL_REQUESTED":
      return "Aprobación";
    case "APPROVED":
      return "Aprobado";
    case "REJECTED":
      return "Rechazado";
    default:
      return event;
  }
}

function mapEventToVariant(
  event: Notification["event"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (event) {
    case "OVERDUE":
      return "destructive";
    case "DUE_SOON":
      return "secondary";
    case "COMPLETED":
      return "default";
    case "REOPENED":
    case "UPDATED":
      return "outline";
    default:
      return "outline";
  }
}
