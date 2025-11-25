"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useStrategyMap } from "@/features/strategic-plans/hooks/useStrategyMap";

type Props = {
  planId?: string;
  value?: string;
  onChange: (value?: string) => void;
  disabled?: boolean;
  placeholder?: string;
  triggerClassName?: string;
  currentObjectiveId?: string;
};

export default function ObjectiveStrategicSelect({
  planId,
  value,
  onChange,
  disabled,
  placeholder = "Selecciona un objetivo...",
  triggerClassName,
  currentObjectiveId,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const { data: objectivesFromApi = [], isLoading } = useStrategyMap(planId);

  const objectives = React.useMemo(
    () => objectivesFromApi.filter((obj) => obj.id !== currentObjectiveId),
    [objectivesFromApi, currentObjectiveId]
  );
  const selectedObjective = React.useMemo(
    () => objectives.find((o) => o.id === value),
    [objectives, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            "font-normal", // 1. Aplicar siempre el peso de fuente normal
            !selectedObjective && "text-muted-foreground", // 2. Aplicar color de placeholder solo si no hay selección
            triggerClassName
          )}
          disabled={disabled || isLoading}
        >
          <span className="truncate">
            {selectedObjective
              ? selectedObjective.name
              : isLoading
              ? "Cargando..."
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Buscar objetivo..." />
          <CommandList>
            <CommandEmpty>No se encontraron objetivos.</CommandEmpty>
            <CommandGroup>
              {objectives.map((objective) => (
                <CommandItem
                  key={objective.id}
                  value={objective.name}
                  onSelect={() => {
                    onChange(objective.id === value ? undefined : objective.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === objective.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {objective.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
