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

import { useObjectives } from "@/features/strategic-plans/hooks/use-objectives";
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
  otherPositions,
  defaultAllowThirdParty = false,
  stacked = false,
  switchLabel = "Permitir objetivos de terceros",
  triggerClassName,
  hideSwitch = false,
  year,
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
  hideSwitch?: boolean;
  year?: number;
}) {
  const [allowThirdParty, setAllowThirdParty] = useState(
    defaultAllowThirdParty
  );
  const switchId = useId();

  const { objectives: ownObjectives, isLoading: loadingOwn } = useObjectives(
    planId!,
    positionId!,
    year
  );

  const ownOpts: ObjectiveOpt[] = useMemo(
    () =>
      (ownObjectives ?? []).map((o: any) => ({
        id: o.id,
        name: o.name ?? o.title ?? o.nombre ?? `Obj ${o.id}`,
      })),
    [ownObjectives]
  );

  const selectedInOwn = useMemo(
    () => !!value && ownOpts.some((o) => o.id === value),
    [value, ownOpts]
  );

  useEffect(() => {
    if (!value) return;
    if (selectedInOwn) return;
    if (!hideSwitch && !allowThirdParty && otherPositions?.length) {
      setAllowThirdParty(true);
    }
  }, [value, selectedInOwn, allowThirdParty, otherPositions, hideSwitch]);

  useEffect(() => {
    if (hideSwitch && allowThirdParty) setAllowThirdParty(false);
  }, [hideSwitch, allowThirdParty]);

  const canShowSwitch = !hideSwitch && !!otherPositions?.length;
  const canUseThirdParty =
    !hideSwitch && allowThirdParty && !!planId && !!otherPositions?.length;

  const thirdPositions = canUseThirdParty ? otherPositions! : [];

  const thirdQueries = useQueries({
    queries: thirdPositions.map((pos) => ({
      queryKey: QKEY.objectives(planId!, pos.id, year),
      queryFn: () => getObjectives(planId!, pos.id, year),
      staleTime: 60_000,
      enabled: !!planId && !!year,
    })),
  });

  const thirdGroups = useMemo(() => {
    if (!canUseThirdParty) return {} as Record<string, ObjectiveOpt[]>;
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
  }, [canUseThirdParty, thirdQueries, thirdPositions]);

  const isLoadingThird = thirdQueries.some((q) => q.isPending);

  return (
    <div
      className={
        stacked ? "flex flex-col gap-2" : "flex items-center gap-3 min-w-0"
      }
    >
      {/* Select (ocupa todo el ancho disponible) */}
      <div className={stacked ? "" : "flex-1 min-w-0"}>
        <Select
          value={value ?? ""}
          onValueChange={(v) => onChange?.(v || undefined)}
          disabled={disabled || loadingOwn || isLoadingThird}
        >
          <SelectTrigger className={triggerClassName ?? "w-full"}>
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

            {canUseThirdParty &&
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
      </div>

      {/* Switch al lado (no-stacked) */}
      {!stacked && canShowSwitch && (
        <div className="shrink-0 flex items-center gap-2">
          <Switch
            id={switchId}
            checked={allowThirdParty}
            onCheckedChange={setAllowThirdParty}
            disabled={disabled || !otherPositions?.length}
          />
          <Label htmlFor={switchId} className="text-xs whitespace-nowrap">
            {switchLabel}
          </Label>
        </div>
      )}

      {/* Switch arriba (stacked) */}
      {stacked && canShowSwitch && (
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
    </div>
  );
}
