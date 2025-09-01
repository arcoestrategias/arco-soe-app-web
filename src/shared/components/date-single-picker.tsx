import * as React from "react";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

export function SingleDatePicker({
  date,
  onChange,
  onClose,
}: {
  date?: Date;
  onChange?: (date?: Date) => void;
  onClose?: () => void;
}) {
  const [selected, setSelected] = React.useState<Date | undefined>(date);

  const handleCancel = () => {
    onChange?.(date); // restaurar
    onClose?.();
  };
  const handleApply = () => {
    onChange?.(selected);
    onClose?.();
  };

  return (
    <div className="flex flex-col gap-3 w-[360px]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Seleccionar fecha</h3>
        <span className="text-xs text-muted-foreground">
          {selected ? selected.toLocaleDateString() : "Sin fecha"}
        </span>
      </div>

      <Calendar
        initialFocus
        mode="single"
        selected={selected}
        onSelect={setSelected}
        numberOfMonths={1}
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
