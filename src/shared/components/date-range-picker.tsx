"use client";

import * as React from "react";
import { addDays, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

interface DateRangePickerProps {
  date?: DateRange;
  onChange?: (date: DateRange | undefined) => void;
  showToastOnApply?: boolean;
  onClose?: () => void;
  onAfterApply?: () => void;
}

export function DateRangePicker({
  date,
  onChange,
  showToastOnApply = false,
  onClose,
  onAfterApply,
}: DateRangePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<DateRange | undefined>(
    date ?? {
      from: new Date(),
      to: addDays(new Date(), 7),
    }
  );

  const handleSelect = (range: DateRange | undefined) => {
    setSelectedDate(range);
  };

  const handleCancel = () => {
    onChange?.(date);
    onClose?.();
  };

  const handleApply = () => {
    onChange?.(selectedDate);
    if (showToastOnApply) {
      toast.success("API ejecutada correctamente");
    }
    onClose?.();
    onAfterApply?.();
  };

  const daysSelected =
    selectedDate?.from && selectedDate?.to
      ? differenceInDays(selectedDate.to, selectedDate.from) + 1
      : 0;

  return (
    <div className="flex flex-col gap-3 w-[500px]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Configurar fechas</h3>
        <span className="text-xs text-muted-foreground">
          {daysSelected > 0
            ? `${daysSelected} días seleccionados`
            : "Sin rango"}
        </span>
      </div>

      <Calendar
        initialFocus
        mode="range"
        defaultMonth={selectedDate?.from}
        selected={selectedDate}
        onSelect={handleSelect}
        numberOfMonths={2}
        locale={es}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={handleApply}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Aplicar
        </Button>
      </div>
    </div>
  );
}
