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
import type { Meeting } from "../types/meetings.types";

interface MeetingListViewProps {
  onEdit: (meetingId: string) => void;
}

export function MeetingListView({ onEdit }: MeetingListViewProps) {
  // 🚩 BANDERA: Activar para ver datos de prueba visualmente sin API
  const SHOW_TEST_DATA = true;

  const companyId = getCompanyId();
  const { data: apiMeetings, isLoading: isLoadingApi } = useMyMeetingsQuery(
    companyId ?? ""
  );
  const deleteMutation = useDeleteMeetingMutation();
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null);

  // Datos de prueba (Mock)
  const mockMeetings: Meeting[] = [
    {
      id: "mock-1",
      name: "Daily Standup - Equipo de Desarrollo",
      frequency: "DAILY",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      participants: Array(5).fill({}),
      createdAt: "",
      updatedAt: "",
    } as Meeting,
    {
      id: "mock-2",
      name: "Revisión Semanal de KPIs",
      frequency: "WEEKLY",
      startDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      endDate: new Date().toISOString(),
      participants: Array(3).fill({}),
      createdAt: "",
      updatedAt: "",
    } as Meeting,
    {
      id: "mock-5",
      name: "Seguimiento Quincenal de Proyectos",
      frequency: "BIWEEKLY",
      startDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      endDate: new Date().toISOString(),
      participants: Array(6).fill({}),
      createdAt: "",
      updatedAt: "",
    } as Meeting,
    {
      id: "mock-3",
      name: "Comité Mensual de Dirección",
      frequency: "MONTHLY",
      startDate: new Date(Date.now() + 86400000 * 10).toISOString(),
      endDate: new Date().toISOString(),
      participants: Array(12).fill({}),
      createdAt: "",
      updatedAt: "",
    } as Meeting,
    {
      id: "mock-4",
      name: "Planificación Trimestral (Q4)",
      frequency: "ONCE",
      startDate: new Date(Date.now() + 86400000 * 20).toISOString(),
      endDate: new Date().toISOString(),
      participants: Array(8).fill({}),
      createdAt: "",
      updatedAt: "",
    } as Meeting,
  ];

  const meetings = SHOW_TEST_DATA ? mockMeetings : apiMeetings;
  const isLoading = SHOW_TEST_DATA ? false : isLoadingApi;

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
                    : meeting.frequency === "DAILY"
                    ? "Diario"
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
