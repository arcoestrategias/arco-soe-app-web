"use client";

import * as React from "react";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import { getStrategicPlansByBusinessUnit } from "@/features/strategic-plans/services/strategicPlansService";
import type { StrategicPlan } from "@/features/strategic-plans/types/types";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  setSelectedPlanId,
  clearSelectedPlanId,
} from "@/shared/filters/storage";

type Props = {
  businessUnitId?: string;
  value?: string | null;
  onChange?: (id: string) => void;

  /** Guardar en filters/storage al seleccionar (default: true) */
  persist?: boolean;
  /** Limpiar del filtro al desmontar el componente (default: false) */
  clearOnUnmount?: boolean;

  className?: string;
  placeholder?: string;
};

function pickMostRecent<
  T extends { fromAt?: string; untilAt?: string; createdAt?: string }
>(plans: T[]): T | undefined {
  return [...plans].sort((a, b) => {
    const ua = a.untilAt ? Date.parse(a.untilAt) : 0;
    const ub = b.untilAt ? Date.parse(b.untilAt) : 0;
    if (ub !== ua) return ub - ua;

    const fa = a.fromAt ? Date.parse(a.fromAt) : 0;
    const fb = b.fromAt ? Date.parse(b.fromAt) : 0;
    if (fb !== fa) return fb - fa;

    const ca = a.createdAt ? Date.parse(a.createdAt) : 0;
    const cb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return cb - ca;
  })[0];
}

export function StrategicPlanSelect({
  businessUnitId,
  value,
  onChange,
  persist = true,
  clearOnUnmount = false,
  className,
  placeholder = "Selecciona un plan",
}: Props) {
  const { data: plans = [], isPending } = useQuery({
    queryKey: businessUnitId
      ? QKEY.strategicPlansByBU(businessUnitId)
      : ["strategic-plans", "bu", "none"],
    queryFn: () => getStrategicPlansByBusinessUnit(businessUnitId!),
    enabled: !!businessUnitId,
    staleTime: 60_000,
  });

  // Autoselect: plan más reciente (si no hay valor controlado)
  useEffect(() => {
    if (!plans.length) return;
    if (value) return;

    const recent = pickMostRecent(plans);
    if (recent) {
      onChange?.(recent.id);
      if (persist) setSelectedPlanId(recent.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans]);

  // Cleanup opcional
  useEffect(() => {
    return () => {
      if (clearOnUnmount) clearSelectedPlanId();
    };
  }, [clearOnUnmount]);

  const selected = useMemo(
    () => plans.find((p: StrategicPlan) => p.id === value) ?? null,
    [plans, value]
  );

  return (
    <div className={className}>
      <Select
        value={value ?? ""}
        onValueChange={(id) => {
          onChange?.(id);
          if (persist) setSelectedPlanId(id);
        }}
        disabled={isPending || plans.length === 0}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={isPending ? "Cargando planes…" : placeholder}
          />
        </SelectTrigger>
        <SelectContent>
          {plans.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
