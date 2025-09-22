"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextareaWithCounter } from "@/shared/components/textarea-with-counter";
import { InputWithCounter } from "@/shared/components/input-with-counter";

export type NewObjectivePayload = {
  objectiveText: string;
  verbo: string;
  meta: string;
  indicador: string;
  alcances: string;
  horizonte: string;
  nivel: "EST" | "OPE" | "";
};

const LEVEL_LABEL: Record<string, string> = {
  EST: "Estratégico",
  OPE: "Operativo",
};

// Construye una oración en español con los fragmentos ingresados.
// Ejemplo: "Incrementar ventas al 15% mediante el indicador Ventas Netas, con alcances Región Costa, horizonte 2026, nivel Estratégico."
function composeSentence(p: NewObjectivePayload) {
  if (!p.verbo && !p.meta) return "";
  const partes: string[] = [];

  // Verbo + Meta
  const base = [p.verbo?.trim(), p.meta?.trim()].filter(Boolean).join(" ");
  if (base) partes.push(base);

  // Indicador
  if (p.indicador?.trim()) partes.push(`${p.indicador.trim()}`);

  // Alcances
  if (p.alcances?.trim()) partes.push(`${p.alcances.trim()}`);

  // Horizonte
  if (p.horizonte?.trim()) partes.push(`${p.horizonte.trim()}`);

  // Une todo en una sola oración.
  const sentence = partes.join(" ");
  return sentence ? `${sentence}` : "";
}

export function NewObjectiveModal({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate?: (payload: NewObjectivePayload) => void;
}) {
  const [payload, setPayload] = useState<NewObjectivePayload>({
    objectiveText: "",
    verbo: "",
    meta: "",
    indicador: "",
    alcances: "",
    horizonte: "",
    nivel: "",
  });

  // Habilitaciones secuenciales
  const canMeta = !!payload.verbo.trim();
  const canIndicador = canMeta && !!payload.meta.trim();
  const canAlcances = canIndicador && !!payload.indicador.trim();
  const canHorizonte = canAlcances && !!payload.alcances.trim();
  const canNivel = canHorizonte && !!payload.horizonte.trim();

  const canSubmit =
    !!payload.verbo.trim() &&
    !!payload.meta.trim() &&
    !!payload.indicador.trim() &&
    !!payload.alcances.trim() &&
    !!payload.horizonte.trim() &&
    (payload.nivel === "EST" || payload.nivel === "OPE");

  // Texto del objetivo: bloqueado (read-only) y generado automáticamente
  const objectiveText = useMemo(() => composeSentence(payload), [payload]);

  useEffect(() => {
    setPayload((p) => ({ ...p, objectiveText }));
  }, [objectiveText]);

  const reset = () => {
    setPayload({
      objectiveText: "",
      verbo: "",
      meta: "",
      indicador: "",
      alcances: "",
      horizonte: "",
      nivel: "",
    });
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  const handleCreate = () => {
    if (!canSubmit) return;
    onCreate?.(payload);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : handleCancel())}
    >
      {/* más ANCHA: usa max-w-4xl (o 3xl si prefieres) */}
      <DialogContent className="w-[95vw] sm:max-w-[800px] md:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Nuevo Objetivo</DialogTitle>
          <DialogDescription>
            Completa los campos en secuencia. El texto del objetivo se arma
            automáticamente en formato de oración.
          </DialogDescription>
        </DialogHeader>

        {/* Fila 1: Objetivo (bloqueado) */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">
            Objetivo
          </label>
          <TextareaWithCounter
            value={objectiveText}
            onChange={() => {}}
            maxLength={600}
            rows={3}
            placeholder="El objetivo se compone automáticamente…"
            className="bg-muted/40"
            // bloqueado:
            // Nota: TextareaWithCounter no expone 'disabled', pero sí acepta props estándar del textarea
            // porque pasa {...props} al Textarea interno.
            // Si tu implementación no lo pasa, cambia a 'readOnly' que sí llega.
            // @ts-expect-error prop passthrough al Textarea interno
            readOnly
          />
        </div>

        {/* Fila 2: Verbo, Meta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Verbo</label>
            <InputWithCounter
              value={payload.verbo}
              onChange={(val) => setPayload((p) => ({ ...p, verbo: val }))}
              maxLength={80}
              placeholder="Escriba la acción a realizar. (Ej. Incrementar, Reducir...)"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Meta</label>
            <InputWithCounter
              value={payload.meta}
              onChange={(val) => setPayload((p) => ({ ...p, meta: val }))}
              maxLength={160}
              placeholder="Escriba el valor esperado para el indicador"
              disabled={!canMeta}
            />
          </div>
        </div>

        {/* Fila 3: Indicador, Alcances */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Indicador
            </label>
            <InputWithCounter
              value={payload.indicador}
              onChange={(val) => setPayload((p) => ({ ...p, indicador: val }))}
              maxLength={160}
              placeholder="Escriba la variable de medición"
              disabled={!canIndicador}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Alcances
            </label>
            <InputWithCounter
              value={payload.alcances}
              onChange={(val) => setPayload((p) => ({ ...p, alcances: val }))}
              maxLength={200}
              placeholder="Escriba el área, división y proceso"
              disabled={!canIndicador}
            />
          </div>
        </div>

        {/* Fila 4: Horizonte, Nivel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Horizonte de tiempo
            </label>
            <InputWithCounter
              value={payload.horizonte}
              onChange={(val) => setPayload((p) => ({ ...p, horizonte: val }))}
              maxLength={120}
              placeholder="Escriba la fecha en la que debe alcanzarse la meta"
              disabled={!canAlcances}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Nivel</label>
            <select
              value={payload.nivel}
              onChange={(e) =>
                setPayload((p) => ({
                  ...p,
                  nivel: e.target.value as "EST" | "OPE" | "",
                }))
              }
              disabled={!canNivel}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Selecciona…</option>
              <option value="EST">Estratégico</option>
              <option value="OPE">Operativo</option>
            </select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!canSubmit}
            className="btn-gradient"
          >
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
