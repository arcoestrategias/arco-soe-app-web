"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type ActionButtonProps = React.ComponentProps<typeof Button> & {
  /** Texto base del botón, p.ej. "Registrar", "Guardar", "Actualizar" */
  label: string;
  /** Acción async (si lo usas como botón imperativo). Si no pasas onAction, puedes usar type="submit" y controlar con loading */
  onAction?: () => Promise<any> | void;
  /** Control externo para estados de envío (útil en formularios con RHF: isSubmitting) */
  loading?: boolean;
  /** Para forzar un texto de carga específico (override) */
  loadingLabel?: string;
};

function toGerund(label: string): string {
  const base = label.trim();
  const lower = base.toLowerCase();

  // elimina " cambios", etc., si quieres un gerundio más limpio
  const cleaned = base.replace(/\s+cambios?$/i, "");

  if (lower.endsWith("ar")) return `${cleaned.slice(0, -2)}ando…`;
  if (lower.endsWith("er") || lower.endsWith("ir"))
    return `${cleaned.slice(0, -2)}iendo…`;

  return "Enviando…";
}

export function ActionButton({
  label,
  onAction,
  loading: loadingProp,
  loadingLabel,
  disabled,
  className,
  children,
  onClick,
  ...rest
}: ActionButtonProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const loading = loadingProp ?? internalLoading;

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onAction) {
      try {
        setInternalLoading(true);
        const r = onAction();
        if (r && typeof (r as any).then === "function") {
          await (r as Promise<any>);
        }
      } finally {
        setInternalLoading(false);
      }
    }
    onClick?.(e);
  };

  const computedLoadingLabel = loadingLabel ?? toGerund(label);
  const content = loading ? (
    <span className="inline-flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      {computedLoadingLabel}
    </span>
  ) : (
    children ?? label
  );

  return (
    <Button
      {...rest}
      onClick={onAction ? handleClick : onClick}
      disabled={disabled || loading}
      className={`h-9 text-base ${className ?? ""} cursor-pointer`}
    >
      {content}
    </Button>
  );
}
