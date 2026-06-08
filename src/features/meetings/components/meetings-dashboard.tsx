"use client";

import { useState } from "react";
import {
  Calendar as CalendarIcon,
  ClipboardList,
  List,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CalendarView } from "./calendar-view";
import { MeetingListView } from "./meeting-list-view";
import { MeetingModal } from "./meeting-modal";
import MeetingMinutesEditor from "./minutes/meeting-minutes-editor";

import type { MeetingCalendarEvent } from "../types/meetings.types";

function meetingIdFromEvent(event: MeetingCalendarEvent | string): string {
  return typeof event === "string" ? event : event.meetingId;
}

export function MeetingsDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [minutesMeetingId, setMinutesMeetingId] = useState<string | null>(null);

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

  const handleGenerateMinutes = (meetingId: string) => {
    setMinutesMeetingId(meetingId);
  };

  const handleCloseMinutes = () => {
    setMinutesMeetingId(null);
  };

  const handleDateClick = (date: Date) => {
    setSelectedMeetingId(null);
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMeetingId(null);
    setSelectedDate(null);
  };

  if (minutesMeetingId) {
    return (
      <MeetingMinutesEditor
        meetingId={minutesMeetingId}
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

        <Button onClick={handleCreate} className="btn-gradient shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Nueva reunión
        </Button>
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
              onEventClick={(event) =>
                handleEditFromList(meetingIdFromEvent(event))
              }
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
