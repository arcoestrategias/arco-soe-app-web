"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Calendar as CalendarIcon, List, Plus, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarView } from "./calendar-view";
import { MeetingListView } from "./meeting-list-view";
import { MeetingModal } from "./meeting-modal";
import MeetingMinutesEditor from "./minutes/meeting-minutes-editor";
import { getMinutes, createMinutes } from "../services/meetingsService";
import type { MeetingCalendarEvent } from "../types/meetings.types";
import { getAccessToken } from "@/shared/auth/storage";

export function MeetingsDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [minutesToOpen, setMinutesToOpen] = useState<{
    meetingId: string;
    minutesId: string;
  } | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null);

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    "http://localhost:4000";

  // Verificar estado de conexión al montar
  useEffect(() => {
    fetch(`${baseUrl}/api/v1/google-calendar/status`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    })
      .then((r) => r.json())
      .then((d) => setCalendarConnected(d?.data?.isConnected ?? d?.isConnected ?? false))
      .catch(() => setCalendarConnected(false));
  }, [baseUrl]);

  // Manejar redirect de Google Calendar OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("calendar") === "connected") {
      setCalendarConnected(true);
      toast.success("Google Calendar conectado exitosamente");
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("calendar") === "error") {
      toast.error("Error al conectar Google Calendar");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleConnectCalendar = () => {
    window.location.href = `${baseUrl}/api/v1/google-calendar/connect`;
  };

  const handleDisconnectCalendar = () => {
    fetch(`${baseUrl}/api/v1/google-calendar/disconnect`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    })
      .then(() => {
        setCalendarConnected(false);
        toast.success("Google Calendar desconectado");
      })
      .catch(() => toast.error("Error al desconectar Google Calendar"));
  };

  const handleCreate = () => {
    setSelectedMeetingId(null);
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  const handleEditFromList = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  const handleGenerateMinutes = async (meetingId: string) => {
    setIsPreparing(true);
    try {
      const existing = await getMinutes(meetingId);
      const created = existing ?? (await createMinutes(meetingId));
      setMinutesToOpen({ meetingId, minutesId: created.id });
    } catch {
      toast.error("Error al preparar el acta");
    }
    setIsPreparing(false);
  };

  const handleCloseMinutes = () => {
    setMinutesToOpen(null);
  };

  const handleDateClick = (date: Date) => {
    setSelectedMeetingId(null);
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleCalendarEventClick = (event: MeetingCalendarEvent) => {
    setSelectedMeetingId(event.meetingId);
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMeetingId(null);
    setSelectedDate(null);
  };

  if (isPreparing) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (minutesToOpen) {
    return (
      <MeetingMinutesEditor
        meetingId={minutesToOpen.meetingId}
        initialMinutesId={minutesToOpen.minutesId}
        onBack={handleCloseMinutes}
      />
    );
  }

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Reuniones de Desempeño
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona reuniones, calendario y actas de desempeño.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón Google Calendar */}
          {calendarConnected === false && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={handleConnectCalendar}
            >
              <CalendarCheck className="mr-2 h-4 w-4 text-blue-500" />
              Conectar Google Calendar
            </Button>
          )}
          {calendarConnected === true && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 text-green-600 border-green-200 hover:text-red-600 hover:border-red-200"
              onClick={handleDisconnectCalendar}
            >
              <CalendarCheck className="mr-2 h-4 w-4 text-green-500" />
              Google Calendar conectado ✓
            </Button>
          )}

          <Button onClick={handleCreate} className="btn-gradient shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Nueva reunión
          </Button>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between rounded-2xl border bg-background px-4 py-3 shadow-sm">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Calendario
            </TabsTrigger>

            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              Mis reuniones
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="calendar" className="mt-4 min-h-0 flex-1">
          <div className="h-[calc(100vh-220px)] min-h-[520px] overflow-hidden rounded-2xl border bg-background shadow-sm">
            <CalendarView
              onEventClick={handleCalendarEventClick}
              onDateClick={handleDateClick}
            />
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <div className="rounded-2xl border bg-background p-4 shadow-sm">
            <MeetingListView
              onEdit={handleEditFromList}
              onGenerateMinutes={handleGenerateMinutes}
            />
          </div>
        </TabsContent>
      </Tabs>

      {isModalOpen && (
        <MeetingModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          meetingId={selectedMeetingId}
          initialDate={selectedDate}
        />
      )}
    </div>
  );
}
