"use client";

import * as React from "react";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import { getPositionsByBusinessUnit } from "@/features/positions/services/positionsService";
import type { Position } from "@/features/positions/types/positions";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  setSelectedPositionId,
  clearSelectedPositionId,
} from "@/shared/filters/storage";
import { getPositionId as getAuthPositionId } from "@/shared/auth/storage";

type Props = {
  businessUnitId?: string;
  value?: string | null;
  onChange?: (id: string) => void;

  /** usar la position del usuario logueado como default */
  defaultFromAuth?: boolean; // default: true
  /** guardar en filters al seleccionar */
  persist?: boolean; // default: true
  /** limpiar del filtro al desmontar */
  clearOnUnmount?: boolean; // default: false

  className?: string;
  placeholder?: string;
};

export function PositionSelect({
  businessUnitId,
  value,
  onChange,
  defaultFromAuth = true,
  persist = true,
  clearOnUnmount = false,
  className,
  placeholder = "Selecciona una posición",
}: Props) {
  const { data: positions = [], isPending } = useQuery({
    queryKey: businessUnitId
      ? QKEY.positionsByBU(businessUnitId)
      : ["positions", "bu", "none"],
    queryFn: () => getPositionsByBusinessUnit(businessUnitId!),
    enabled: !!businessUnitId,
    staleTime: 60_000,
  });

  // Autoselect: posición del usuario (si existe en la lista) o primera
  useEffect(() => {
    if (!positions.length) return;
    if (value) return;

    let chosen: string | null = null;

    if (defaultFromAuth) {
      const fromAuth = getAuthPositionId();
      const exists = fromAuth && positions.some((p) => p.id === fromAuth);
      if (exists) chosen = fromAuth!;
    }

    if (!chosen) chosen = positions[0]?.id ?? null;
    if (chosen) {
      onChange?.(chosen);
      if (persist) setSelectedPositionId(chosen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions]);

  // Cleanup opcional
  useEffect(() => {
    return () => {
      if (clearOnUnmount) clearSelectedPositionId();
    };
  }, [clearOnUnmount]);

  const selected = useMemo(
    () => positions.find((p: Position) => p.id === value) ?? null,
    [positions, value]
  );

  return (
    <div className={className}>
      <Select
        value={value ?? ""}
        onValueChange={(id) => {
          onChange?.(id);
          if (persist) setSelectedPositionId(id);
        }}
        disabled={isPending || positions.length === 0}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={isPending ? "Cargando posiciones…" : placeholder}
          />
        </SelectTrigger>
        <SelectContent>
          {positions.map((pos) => (
            <SelectItem key={pos.id} value={pos.id}>
              {pos.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
