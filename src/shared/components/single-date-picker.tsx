"use client";

import * as React from "react";
import {
  addDays,
  differenceInDays,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
} from "date-fns";
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
  // onAfterApply?: () => void;
  onApply?: (date: DateRange | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
}

export function DateRangePicker({
  date,
  onChange,
  showToastOnApply = false,
  onClose,
  // onAfterApply,
  onApply,
  minDate,
  maxDate,
}: DateRangePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<DateRange | undefined>(
    date ?? {
      from: new Date(),
      to: addDays(new Date(), 7),
    }
  );

  // Deshabilitar días fuera de rango (react-day-picker)
  const disabledDays = React.useMemo(() => {
    const rules: any[] = [];
    if (minDate) rules.push({ before: startOfDay(minDate) });
    if (maxDate) rules.push({ after: endOfDay(maxDate) });
    return rules.length ? rules : undefined;
  }, [minDate, maxDate]);

  const handleSelect = (range: DateRange | undefined) => {
    if (!range?.from || !range?.to) {
      setSelectedDate(range);
      return;
    }

    // Validación defensiva (el calendario ya bloquea, pero reforzamos)
    if (minDate && isBefore(range.from, startOfDay(minDate))) {
      toast.error("La fecha inicio no puede ser anterior al rango del Plan.");
      return;
    }
    if (maxDate && isAfter(range.to, endOfDay(maxDate))) {
      toast.error("La fecha fin no puede ser posterior al rango del Plan.");
      return;
    }
    if (isAfter(range.from, range.to)) {
      toast.error("La fecha de inicio no puede ser mayor que la fecha de fin.");
      return;
    }

    setSelectedDate(range);
  };

  const handleCancel = () => {
    onChange?.(date);
    onClose?.();
  };

  const handleApply = () => {
    // Última validación al aplicar
    if (selectedDate?.from && selectedDate?.to) {
      if (minDate && isBefore(selectedDate.from, startOfDay(minDate))) {
        toast.error("La fecha inicio no puede ser anterior al rango del Plan.");
        return;
      }
      if (maxDate && isAfter(selectedDate.to, endOfDay(maxDate))) {
        toast.error("La fecha fin no puede ser posterior al rango del Plan.");
        return;
      }
    }

    onChange?.(selectedDate);
    onApply?.(selectedDate);
    if (showToastOnApply) {
      toast.success("Fecha actualizada correctamente");
    }
    onClose?.();
    // onAfterApply?.();
  };

  const daysSelected =
    selectedDate?.from && selectedDate?.to
      ? differenceInDays(selectedDate.to, selectedDate.from) + 1
      : 0;

  // Mes por defecto dentro del rango (si hay límites)
  const defaultMonth =
    selectedDate?.from ?? minDate ?? selectedDate?.to ?? new Date();

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
        defaultMonth={defaultMonth}
        selected={selectedDate}
        onSelect={handleSelect}
        numberOfMonths={2}
        locale={es}
        disabled={disabledDays} // ← BLOQUEO real en el calendario
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
