"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCalendarOccurrencesQuery } from "../hooks/use-meetings";
import { getCompanyId, getBusinessUnitId } from "@/shared/auth/storage";
import type { MeetingOccurrence } from "../types/meetings.types";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  onEventClick: (occurrence: MeetingOccurrence) => void;
  onDateClick?: (date: Date) => void;
}

export function CalendarView({
  onEventClick,
  onDateClick,
}: CalendarViewProps) {
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
    <div className="flex flex-col h-full">
      {/* Header Calendario */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold capitalize">{monthName}</h2>
          <div className="flex items-center border rounded-md ml-4">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToday}>
              Hoy
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid Semanal Header */}
      <div className="grid grid-cols-7 border-b bg-muted/40 text-center py-2 text-sm font-medium text-muted-foreground">
        <div>Lun</div>
        <div>Mar</div>
        <div>Mié</div>
        <div>Jue</div>
        <div>Vie</div>
        <div>Sáb</div>
        <div>Dom</div>
      </div>

      {/* Grid Días */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto">
        {calendarDays.map((date, idx) => {
          if (!date) {
            return (
              <div
                key={`empty-${idx}`}
                className="border-b border-r bg-muted/10"
              />
            );
          }

          const dayEvents = eventsByDay[date.getDate()] || [];
          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <div
              key={date.toISOString()}
              className={cn(
                "border-b border-r p-2 min-h-[100px] flex flex-col gap-1 transition-colors hover:bg-muted/5 cursor-pointer",
                isToday && "bg-blue-50/50"
              )}
              onClick={() => onDateClick?.(date)}
            >
              <div className="flex justify-between items-start">
                <span
                  className={cn(
                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {date.getDate()}
                </span>
              </div>

              <div className="flex flex-col gap-1 mt-1">
                {dayEvents.map((evt) => (
                  <button
                    key={evt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(evt);
                    }}
                    className={cn(
                      "text-xs text-left px-2 py-1 rounded border truncate flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]",
                      evt.isExecuted
                        ? "bg-green-100 border-green-200 text-green-800"
                        : "bg-white border-border hover:border-primary/50"
                    )}
                  >
                    {evt.isExecuted ? (
                      <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                    ) : (
                      <Clock className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate font-medium">
                      {new Date(evt.start).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      {evt.title}
                    </span>
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
