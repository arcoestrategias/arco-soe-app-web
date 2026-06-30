"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Calendar as CalendarIcon, List, Plus } from "lucide-react";
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
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [outlookConnected, setOutlookConnected] = useState<boolean | null>(null);

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    "http://localhost:4000";

  const authHeaders = {
    Authorization: `Bearer ${getAccessToken()}`,
  };

  // Verificar estado de conexión al montar
  useEffect(() => {
    fetch(`${baseUrl}/api/v1/google-calendar/status`, {
      credentials: "include",
      headers: authHeaders,
    })
      .then((r) => r.json())
      .then((d) => setGoogleConnected(d?.data?.isConnected ?? d?.isConnected ?? false))
      .catch(() => setGoogleConnected(false));

    fetch(`${baseUrl}/api/v1/outlook-calendar/status`, {
      credentials: "include",
      headers: authHeaders,
    })
      .then((r) => r.json())
      .then((d) => setOutlookConnected(d?.data?.isConnected ?? d?.isConnected ?? false))
      .catch(() => setOutlookConnected(false));
  }, [baseUrl]);

  // Manejar redirect de OAuth de calendarios
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const calendarStatus = params.get("calendar");
    const provider = params.get("provider");

    if (calendarStatus === "connected") {
      if (provider === "outlook") {
        setOutlookConnected(true);
        toast.success("Outlook Calendar conectado exitosamente");
      } else {
        setGoogleConnected(true);
        toast.success("Google Calendar conectado exitosamente");
      }
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (calendarStatus === "error") {
      toast.error(`Error al conectar ${provider === "outlook" ? "Outlook" : "Google"} Calendar`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleConnectGoogle = () => {
    window.location.href = `${baseUrl}/api/v1/google-calendar/connect`;
  };

  const handleDisconnectGoogle = () => {
    fetch(`${baseUrl}/api/v1/google-calendar/disconnect`, {
      credentials: "include",
      headers: authHeaders,
    })
      .then(() => {
        setGoogleConnected(false);
        toast.success("Google Calendar desconectado");
      })
      .catch(() => toast.error("Error al desconectar Google Calendar"));
  };

  const handleConnectOutlook = () => {
    window.location.href = `${baseUrl}/api/v1/outlook-calendar/connect`;
  };

  const handleDisconnectOutlook = () => {
    fetch(`${baseUrl}/api/v1/outlook-calendar/disconnect`, {
      credentials: "include",
      headers: authHeaders,
    })
      .then(() => {
        setOutlookConnected(false);
        toast.success("Outlook Calendar desconectado");
      })
      .catch(() => toast.error("Error al desconectar Outlook Calendar"));
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

  const handleCloseMinutes = () => setMinutesToOpen(null);

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

        <div className="flex flex-wrap items-center gap-2">

          {/* ── Google Calendar ── */}
          {googleConnected === false && (
            <button
              onClick={handleConnectGoogle}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-blue-300 hover:shadow-md hover:bg-blue-50"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 4.19v3.37h3.57c2.09-1.93 3.27-4.77 3.27-8.57z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.64l-3.57-3.37c-.98.66-2.23 1.05-3.71 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v3.44C3.97 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V6.47H2.18C1.43 8.07 1 9.93 1 12s.43 3.93 1.18 5.53l3.66-3.44z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.25-3.16C17.45 2.09 14.97 1 12 1 7.7 1 3.97 3.47 2.18 6.47l3.66 3.44C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335" />
              </svg>
              Conectar Google Calendar
            </button>
          )}
          {googleConnected === true && (
            <button
              onClick={handleDisconnectGoogle}
              className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 4.19v3.37h3.57c2.09-1.93 3.27-4.77 3.27-8.57z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.64l-3.57-3.37c-.98.66-2.23 1.05-3.71 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v3.44C3.97 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V6.47H2.18C1.43 8.07 1 9.93 1 12s.43 3.93 1.18 5.53l3.66-3.44z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.25-3.16C17.45 2.09 14.97 1 12 1 7.7 1 3.97 3.47 2.18 6.47l3.66 3.44C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335" />
              </svg>
              Google Calendar ✓
            </button>
          )}

          {/* ── Outlook Calendar ── */}
          {outlookConnected === false && (
            <button
              onClick={handleConnectOutlook}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-blue-400 hover:shadow-md hover:bg-blue-50"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path d="M24 12.003C24 18.628 18.628 24 12 24S0 18.628 0 12.003C0 5.376 5.372 0 12 0s12 5.376 12 12.003z" fill="#0078D4"/>
                <path d="M12 5.5C8.41 5.5 5.5 8.41 5.5 12S8.41 18.5 12 18.5 18.5 15.59 18.5 12 15.59 5.5 12 5.5zm0 11c-2.485 0-4.5-2.015-4.5-4.5S9.515 7.5 12 7.5s4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5z" fill="#fff"/>
              </svg>
              Conectar Outlook Calendar
            </button>
          )}
          {outlookConnected === true && (
            <button
              onClick={handleDisconnectOutlook}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path d="M24 12.003C24 18.628 18.628 24 12 24S0 18.628 0 12.003C0 5.376 5.372 0 12 0s12 5.376 12 12.003z" fill="#0078D4"/>
                <path d="M12 5.5C8.41 5.5 5.5 8.41 5.5 12S8.41 18.5 12 18.5 18.5 15.59 18.5 12 15.59 5.5 12 5.5zm0 11c-2.485 0-4.5-2.015-4.5-4.5S9.515 7.5 12 7.5s4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5z" fill="#fff"/>
              </svg>
              Outlook Calendar ✓
            </button>
          )}

          {/* ── Nueva reunión ── */}
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
