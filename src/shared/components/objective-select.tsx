// shared/components/objective-select.tsx
"use client";

import { useEffect, useMemo, useState, useId } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Hook real para "mis objetivos"
import { useObjectives } from "@/features/strategic-plans/hooks/use-objectives";
// Service real para terceros (named export)
import { getObjectives } from "@/features/strategic-plans/services/objectivesService";
import { QKEY } from "@/shared/api/query-keys";

type PositionOpt = { id: string; name: string };
type ObjectiveOpt = { id: string; name: string };

export default function ObjectiveSelect({
  planId,
  positionId,
  value,
  onChange,
  disabled,
  otherPositions, // posiciones “de terceros” (todas menos la actual)
  defaultAllowThirdParty = false,
  // NUEVOS props no-rompedores:
  stacked = false, // ← cuando true, pone el switch arriba del select
  switchLabel = "Permitir objetivos de terceros",
  triggerClassName, // para personalizar ancho si lo necesitas
}: {
  planId?: string;
  positionId?: string;
  value?: string;
  onChange?: (id?: string) => void;
  disabled?: boolean;
  otherPositions?: PositionOpt[];
  defaultAllowThirdParty?: boolean;
  stacked?: boolean;
  switchLabel?: string;
  triggerClassName?: string;
}) {
  const [allowThirdParty, setAllowThirdParty] = useState(
    defaultAllowThirdParty
  );
  const switchId = useId();

  // Mis objetivos
  const ownEnabled = !!planId && !!positionId && !disabled;
  const { objectives: ownObjectives, isLoading: loadingOwn } = useObjectives(
    planId!,
    positionId!
  );

  const ownOpts: ObjectiveOpt[] = useMemo(
    () =>
      (ownObjectives ?? []).map((o: any) => ({
        id: o.id,
        name: o.name ?? o.title ?? o.nombre ?? `Obj ${o.id}`,
      })),
    [ownObjectives]
  );

  // ¿El valor actual está en "Mis objetivos"?
  const selectedInOwn = useMemo(
    () => !!value && ownOpts.some((o) => o.id === value),
    [value, ownOpts]
  );

  // Si hay valor preseleccionado y NO está en propios, habilitar terceros automáticamente
  useEffect(() => {
    if (!value) return;
    if (selectedInOwn) return;
    if (!allowThirdParty && otherPositions?.length) {
      setAllowThirdParty(true);
    }
  }, [value, selectedInOwn, allowThirdParty, otherPositions]);

  // Candidatos “terceros” solo si activas el switch
  const thirdPositions =
    allowThirdParty && planId && otherPositions?.length ? otherPositions : [];

  const thirdQueries = useQueries({
    queries: thirdPositions.map((pos) => ({
      queryKey: QKEY.objectives(planId!, pos.id),
      queryFn: () => getObjectives(planId!, pos.id),
      staleTime: 60_000,
      enabled: !!planId,
    })),
  });

  const thirdGroups = useMemo(() => {
    if (!allowThirdParty) return {} as Record<string, ObjectiveOpt[]>;
    const groups: Record<string, ObjectiveOpt[]> = {};
    thirdQueries.forEach((q, idx) => {
      const pos = thirdPositions[idx];
      const list = (q.data ?? []) as any[];
      groups[pos.name] = list.map((o) => ({
        id: o.id,
        name: o.name ?? o.title ?? o.nombre ?? `Obj ${o.id}`,
      }));
    });
    return groups;
  }, [allowThirdParty, thirdQueries, thirdPositions]);

  const isLoadingThird = thirdQueries.some((q) => q.isPending);

  // Layout: stacked = switch arriba del select; sino, en fila como antes
  return (
    <div
      className={stacked ? "flex flex-col gap-2" : "flex items-center gap-3"}
    >
      {/* Switch + Label (arriba si stacked, a la derecha si no) */}
      {stacked && (
        <label
          htmlFor={switchId}
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <Switch
            id={switchId}
            checked={allowThirdParty}
            onCheckedChange={setAllowThirdParty}
            disabled={disabled || !otherPositions?.length}
          />
          {switchLabel}
        </label>
      )}

      <Select
        value={value ?? ""}
        onValueChange={(v) => onChange?.(v || undefined)}
        disabled={disabled || loadingOwn || isLoadingThird}
      >
        <SelectTrigger className={triggerClassName ?? "w-full max-w-[420px]"}>
          <SelectValue
            placeholder={
              loadingOwn || isLoadingThird
                ? "Cargando objetivos..."
                : "Seleccionar objetivo"
            }
          />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Mis objetivos</SelectLabel>
            {ownOpts.length === 0 ? (
              <SelectItem value="__empty_own" disabled>
                (Sin objetivos)
              </SelectItem>
            ) : (
              ownOpts.map((o) => (
                <SelectItem key={`own-${o.id}`} value={o.id}>
                  {o.name}
                </SelectItem>
              ))
            )}
          </SelectGroup>

          {allowThirdParty &&
            Object.entries(thirdGroups).map(([cargo, list]) => (
              <SelectGroup key={cargo}>
                <SelectLabel>{cargo}</SelectLabel>
                {list.length === 0 ? (
                  <SelectItem value={`__empty_${cargo}`} disabled>
                    (Sin objetivos)
                  </SelectItem>
                ) : (
                  list.map((o) => (
                    <SelectItem key={`${cargo}-${o.id}`} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))
                )}
              </SelectGroup>
            ))}
        </SelectContent>
      </Select>

      {!stacked && (
        <div className="flex items-center gap-2">
          <Switch
            id={switchId}
            checked={allowThirdParty}
            onCheckedChange={setAllowThirdParty}
            disabled={disabled || !otherPositions?.length}
          />
          <Label htmlFor={switchId} className="text-xs">
            {switchLabel}
          </Label>
        </div>
      )}
    </div>
  );
}
