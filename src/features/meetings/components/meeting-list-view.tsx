"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Trash, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/shared/components/confirm-modal";
import { getCompanyId } from "@/shared/auth/storage";

import {
  useMyMeetingsQuery,
  useDeleteMeetingMutation,
} from "../hooks/use-meetings";

interface MeetingListViewProps {
  onEdit: (meetingId: string) => void;
}

export function MeetingListView({ onEdit }: MeetingListViewProps) {
  const companyId = getCompanyId();
  const { data: meetings, isLoading } = useMyMeetingsQuery(companyId ?? "");
  const deleteMutation = useDeleteMeetingMutation();
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null);

  const handleDelete = () => {
    if (!meetingToDelete) return;
    deleteMutation.mutate(
      { id: meetingToDelete, params: { scope: "SERIES" } },
      {
        onSuccess: () => {
          toast.success("Reunión eliminada");
          setMeetingToDelete(null);
        },
        onError: () => toast.error("Error al eliminar"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!meetings || meetings.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground border rounded-md">
        No tienes reuniones asignadas.
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Nombre</th>
            <th className="px-4 py-3 text-left font-medium">Frecuencia</th>
            <th className="px-4 py-3 text-left font-medium">Próxima Sesión</th>
            <th className="px-4 py-3 text-center font-medium">Participantes</th>
            <th className="px-4 py-3 text-center font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {meetings.map((meeting) => (
            <tr key={meeting.id} className="border-t hover:bg-muted/50">
              <td className="px-4 py-3 font-medium">{meeting.name}</td>
              <td className="px-4 py-3">
                <Badge variant="secondary">
                  {meeting.frequency === "ONCE"
                    ? "Una vez"
                    : meeting.frequency === "WEEKLY"
                    ? "Semanal"
                    : meeting.frequency === "BIWEEKLY"
                    ? "Quincenal"
                    : "Mensual"}
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {format(new Date(meeting.startDate), "PPP p", { locale: es })}
              </td>
              <td className="px-4 py-3 text-center">
                {meeting.participants.length}
              </td>
              <td className="px-4 py-3 text-center flex justify-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(meeting.id)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setMeetingToDelete(meeting.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ConfirmModal
        open={!!meetingToDelete}
        onCancel={() => setMeetingToDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Reunión"
        message="¿Estás seguro de eliminar esta serie de reuniones? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        isDestructive
      />
    </div>
  );
}
