"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import { getStrategicPlans } from "@/features/strategic-plans/services/strategicPlansService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { StrategicPlan } from "@/features/strategic-plans/types/types";

type Props = {
  open: boolean;
  value?: string | null; // strategicPlanId actual (si existe)
  onClose: () => void;
  onChange: (id: string) => void; // devolver el id seleccionado
};

export function StrategicPlanFilterModal({
  open,
  value,
  onClose,
  onChange,
}: Props) {
  const { data: plans = [], isPending } = useQuery({
    queryKey: QKEY.strategicPlans,
    queryFn: getStrategicPlans,
    staleTime: 60_000,
  });

  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    if (open) {
      setSelected(value ?? "");
    }
  }, [open, value]);

  const save = () => {
    if (selected) {
      onChange(selected);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Selecciona un Plan Estratégico</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Plan</Label>
          <Select
            value={selected}
            onValueChange={setSelected}
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={isPending ? "Cargando planes…" : "Elige un plan"}
              />
            </SelectTrigger>
            <SelectContent>
              {plans.map((p: StrategicPlan) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="btn-gradient"
            onClick={save}
            disabled={!selected || isPending}
          >
            Usar este plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
