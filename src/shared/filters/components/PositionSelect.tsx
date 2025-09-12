// shared/filters/components/PositionSelect.tsx
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
  onChange?: (id: string | null) => void;

  /** usar la position del usuario logueado como default */
  defaultFromAuth?: boolean; // default: true
  /** guardar en filters al seleccionar */
  persist?: boolean; // default: true
  /** limpiar del filtro al desmontar */
  clearOnUnmount?: boolean; // default: false

  /** Mostrar la opción "Todos" al inicio de la lista */
  showOptionAll?: boolean; // default: false

  className?: string;
  placeholder?: string;
};

const ALL_VALUE = "__ALL__";

export function PositionSelect({
  businessUnitId,
  value,
  onChange,
  defaultFromAuth = true,
  persist = true,
  clearOnUnmount = false,
  showOptionAll = false,
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

  // Autoselect: posición del usuario (si existe) o primera
  // IMPORTANTE: si showOptionAll está activo y value === null, NO autoseleccionamos nada.
  useEffect(() => {
    if (!positions.length) return;

    // Si ya hay un valor explícito (incluyendo null con showOptionAll), no autoseleccionar.
    if (value !== undefined) {
      if (showOptionAll && value === null) return; // respetar "Todos"
      if (value) return; // ya hay valor
    }

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

  // Limpieza opcional al desmontar
  useEffect(() => {
    return () => {
      if (clearOnUnmount) clearSelectedPositionId();
    };
  }, [clearOnUnmount]);

  const selected = useMemo(
    () => positions.find((p: Position) => p.id === value) ?? null,
    [positions, value]
  );

  // Valor que ve el <Select>: si showOptionAll y value === null → "__ALL__"
  const selectValue = showOptionAll && value === null ? ALL_VALUE : value ?? "";

  return (
    <div className={className}>
      <Select
        value={selectValue}
        onValueChange={(id) => {
          if (showOptionAll && id === ALL_VALUE) {
            onChange?.(null);
            if (persist) clearSelectedPositionId();
            return;
          }
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
          {showOptionAll && (
            <SelectItem key={ALL_VALUE} value={ALL_VALUE}>
              Todos
            </SelectItem>
          )}
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
