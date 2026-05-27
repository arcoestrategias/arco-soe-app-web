"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarView } from "./calendar-view";
import { MeetingListView } from "./meeting-list-view";
import { MeetingModal } from "./meeting-modal";
import MeetingMinutesEditor from "./minutes/meeting-minutes-editor";
import type { MeetingOccurrence } from "../types/meetings.types";

export function MeetingsDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    null
  );
  const [selectedOccurrence, setSelectedOccurrence] =
    useState<MeetingOccurrence | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [minutesMeetingId, setMinutesMeetingId] = useState<string | null>(null);

  // Abrir modal para crear
  const handleCreate = () => {
    setSelectedMeetingId(null);
    setSelectedOccurrence(null);
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar (desde click en evento)
  const handleEdit = (occurrence: MeetingOccurrence) => {
    setSelectedMeetingId(occurrence.meetingId);
    setSelectedOccurrence(occurrence);
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar (desde lista)
  const handleEditFromList = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    setSelectedOccurrence(null);
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  // Abrir editor de actas
  const handleGenerateMinutes = (meetingId: string) => {
    setMinutesMeetingId(meetingId);
  };

  const handleCloseMinutes = () => {
    setMinutesMeetingId(null);
  };

  // Abrir modal al hacer clic en un día del calendario
  const handleDateClick = (date: Date) => {
    setSelectedMeetingId(null);
    setSelectedOccurrence(null);
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMeetingId(null);
    setSelectedOccurrence(null);
    setSelectedDate(null);
  };

  // Si estamos viendo el editor de actas
  if (minutesMeetingId) {
    return (
      <MeetingMinutesEditor
        meetingId={minutesMeetingId}
        onBack={handleCloseMinutes}
      />
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Reuniones de Desempeño
        </h1>
        <Button onClick={handleCreate} className="btn-gradient">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Reunión
        </Button>
      </div>

      <Tabs defaultValue="calendar" className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="calendar">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Calendario
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="mr-2 h-4 w-4" />
              Mis Reuniones
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="calendar" className="flex-1 h-full mt-0">
          <div className="border rounded-md h-[calc(100vh-220px)] bg-background shadow-sm">
            <CalendarView
              onEventClick={handleEdit}
              onDateClick={handleDateClick}
            />
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          <MeetingListView
            onEdit={handleEditFromList}
            onGenerateMinutes={handleGenerateMinutes}
          />
        </TabsContent>
      </Tabs>

      {isModalOpen && (
        <MeetingModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          meetingId={selectedMeetingId}
          occurrence={selectedOccurrence}
          initialDate={selectedDate}
        />
      )}
    </div>
  );
}
