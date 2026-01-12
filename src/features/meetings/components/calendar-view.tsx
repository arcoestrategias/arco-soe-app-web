"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCalendarOccurrencesQuery } from "../hooks/use-meetings";
import { getCompanyId, getBusinessUnitId } from "@/shared/auth/storage";
import type { MeetingOccurrence } from "../types/meetings.types";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  onEventClick: (occurrence: MeetingOccurrence) => void;
  onDateClick?: (date: Date) => void;
}

export function CalendarView({ onEventClick, onDateClick }: CalendarViewProps) {
  // Estado para la fecha actual (mes visible)
  const [currentDate, setCurrentDate] = useState(new Date());

  // IDs de contexto para multi-empresa
  const companyId = getCompanyId();
  const businessUnitId = getBusinessUnitId();

  // Calcular rango para la API (inicio y fin de mes)
  const { fromStr, toStr } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);

    return {
      fromStr: firstDay.toISOString().split("T")[0],
      toStr: lastDay.toISOString().split("T")[0],
    };
  }, [currentDate]);

  const { data: occurrences, isLoading } = useCalendarOccurrencesQuery(
    fromStr,
    toStr,
    companyId ?? "",
    businessUnitId ?? undefined
  );

  // Navegación
  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };
  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };
  const goToday = () => setCurrentDate(new Date());

  // Generar días del calendario
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Ajustar para que la semana empiece en Lunes (0=Domingo en JS)
    // JS: 0=Dom, 1=Lun... Queremos 0=Lun, 6=Dom
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const days = [];
    // Relleno previo
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    // Días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentDate]);

  // Agrupar eventos por día
  const eventsByDay = useMemo(() => {
    if (!occurrences) return {};
    const map: Record<string, MeetingOccurrence[]> = {};
    occurrences.forEach((occ) => {
      const dateKey = new Date(occ.start).getDate();
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(occ);
    });
    return map;
  }, [occurrences]);

  const monthName = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(currentDate);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header Calendario Moderno */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-foreground capitalize tracking-tight leading-none">
            {monthName}
          </h2>
          <span className="text-sm text-muted-foreground font-medium mt-1">
            {currentDate.getFullYear()}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevMonth}
            className="h-8 w-8 hover:bg-background hover:shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToday}
            className="h-8 px-3 text-xs font-medium hover:bg-background hover:shadow-sm"
          >
            Hoy
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextMonth}
            className="h-8 w-8 hover:bg-background hover:shadow-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid Semanal Header */}
      <div className="grid grid-cols-7 border-b bg-muted/10">
        {[
          "Lunes",
          "Martes",
          "Miércoles",
          "Jueves",
          "Viernes",
          "Sábado",
          "Domingo",
        ].map((day) => (
          <div
            key={day}
            className="py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center"
          >
            {day.substring(0, 3)}
          </div>
        ))}
      </div>

      {/* Grid Días */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto bg-muted/5">
        {calendarDays.map((date, idx) => {
          if (!date) {
            return (
              <div
                key={`empty-${idx}`}
                className="border-b border-r bg-muted/5"
              />
            );
          }

          const dayEvents = eventsByDay[date.getDate()] || [];
          const isToday = new Date().toDateString() === date.toDateString();
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return (
            <div
              key={date.toISOString()}
              className={cn(
                "group relative border-b border-r p-2 min-h-[120px] flex flex-col gap-1 transition-all hover:bg-background hover:shadow-[inset_0_0_20px_rgba(0,0,0,0.02)] cursor-pointer",
                isToday ? "bg-blue-50/30" : "bg-background",
                isWeekend && !isToday && "bg-muted/10"
              )}
              onClick={() => onDateClick?.(date)}
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className={cn(
                    "text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full transition-transform group-hover:scale-110",
                    isToday
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground group-hover:text-foreground group-hover:bg-muted"
                  )}
                >
                  {date.getDate()}
                </span>
                {/* Botón flotante de agregar (visible en hover) */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                {dayEvents.map((evt) => (
                  <button
                    key={evt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(evt);
                    }}
                    className={cn(
                      "group/evt relative text-xs text-left pl-2.5 pr-2 py-1.5 rounded-md border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md w-full overflow-hidden",
                      evt.isExecuted
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : evt.isCancelled
                        ? "bg-red-50 border-red-200 text-red-900 opacity-70 line-through decoration-red-900/50"
                        : "bg-white border-border text-foreground hover:border-primary/40"
                    )}
                  >
                    {/* Indicador lateral de color */}
                    <div
                      className={cn(
                        "absolute left-0 top-0 bottom-0 w-1",
                        evt.isExecuted
                          ? "bg-emerald-500"
                          : evt.isCancelled
                          ? "bg-red-500"
                          : "bg-primary"
                      )}
                    />

                    <div className="flex items-center gap-1.5">
                      {evt.isExecuted ? (
                        <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-emerald-600" />
                      ) : (
                        <Clock className="h-3 w-3 flex-shrink-0 text-muted-foreground/70 group-hover/evt:text-primary" />
                      )}
                      <span className="truncate font-medium leading-none">
                        {evt.title}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 pl-4.5 truncate opacity-80">
                      {new Date(evt.start).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {evt.location && ` · ${evt.location}`}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
