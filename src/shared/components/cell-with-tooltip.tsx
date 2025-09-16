"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import clsx from "clsx";

export type TooltipLine = {
  label?: string;
  text: string;
};

type Props = {
  children: React.ReactNode;
  text?: string;
  lines?: TooltipLine[];
  customContent?: React.ReactNode;
  maxWidth?: number;
  /** ya no usamos scroll vertical, solo límite de ancho */
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  className?: string;
};

export function CellWithTooltip({
  children,
  text,
  lines,
  customContent,
  maxWidth = 480, // controla cuánto puede crecer de ancho
  side = "top",
  align = "center",
  className,
}: Props) {
  const contentNode = React.useMemo(() => {
    if (customContent) {
      return (
        <div className="text-sm leading-5 text-popover-foreground whitespace-pre-wrap break-words">
          {customContent}
        </div>
      );
    }

    if (Array.isArray(lines) && lines.length > 0) {
      return (
        <div className="space-y-2 text-popover-foreground">
          {lines.map((ln, idx) => (
            <div key={idx} className="text-sm leading-5 break-words">
              {ln.label ? (
                <div className="font-semibold mb-0.5">{ln.label}</div>
              ) : null}
              <div className="whitespace-pre-wrap">{ln.text}</div>
            </div>
          ))}
        </div>
      );
    }

    if (typeof text === "string" && text.length > 0) {
      return (
        <div className="text-sm leading-5 text-popover-foreground whitespace-pre-wrap break-words">
          {text}
        </div>
      );
    }

    return (
      <div className="text-sm leading-5 text-muted-foreground">
        Sin información
      </div>
    );
  }, [customContent, lines, text]);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={clsx(
            "rounded-xl shadow-lg",
            "p-3",
            "bg-popover text-popover-foreground",
            "border border-border",
            className
          )}
          style={{
            maxWidth,
            overflow: "visible", // deja crecer el contenido
          }}
        >
          {contentNode}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default CellWithTooltip;
