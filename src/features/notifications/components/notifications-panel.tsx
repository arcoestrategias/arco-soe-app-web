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

    // Navegación futura por entityType
    // if (notif.entityType === "PRIORITY" && notif.entityId) {
    //   router.push(`/priorities/${notif.entityId}`);
    //   if (onClose) onClose();
    // }
  };

  const handleMarkAllRead = () => {
    const ids = items.filter((n) => n.status === "SENT").map((n) => n.id);

    if (!ids.length || isMarkingAll) return;

    markAllRead(ids);
  };

  return (
    <div className="rounded-lg border bg-background shadow-lg flex flex-col max-h-[70vh]">
      {/* Header */}
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

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !items.length ? (
          <div className="flex h-40 items-center justify-center text-xs text-muted-foreground px-4 text-center">
            No tienes notificaciones por el momento.
          </div>
        ) : (
          // Ya no se necesita ScrollArea aquí, el div padre se encarga.
          <ul className="divide-y">
            {items.map((notif) => (
              <li
                key={notif.id}
                className={cn(
                  "flex gap-3 px-3 py-2 text-xs cursor-pointer hover:bg-muted/60 transition-colors",
                  notif.status === "SENT" && "bg-muted/40 font-semibold"
                )}
                onClick={() => handleClickItem(notif)}
              >
                {/* DOT IZQUIERDO */}
                <div className="pt-1">
                  {notif.status === "SENT" ? (
                    <span className="block h-2 w-2 rounded-full bg-primary" />
                  ) : (
                    <span className="block h-2 w-2 rounded-full bg-muted-foreground/40" />
                  )}
                </div>

                {/* CONTENIDO */}
                <div className="flex-1 space-y-1">
                  <div className="text-[11px] font-semibold line-clamp-2">
                    {notif.title}
                  </div>

                  {notif.message && (
                    <div className="text-[11px] text-muted-foreground line-clamp-2">
                      {notif.message}
                    </div>
                  )}
                </div>

                {/* META (TIEMPO + BADGE) */}
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
                    className="text-[9px] px-1 py-0 h-4 whitespace-nowrap"
                  >
                    {mapEventToLabel(notif.event)}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* Helpers */
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
