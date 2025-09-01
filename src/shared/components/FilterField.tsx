"use client";

import * as React from "react";

export function FilterField({
  label,
  description,
  children,
  className,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? ""}>
      <div className="text-xs font-medium text-muted-foreground mb-1">
        {label}
      </div>
      <div>{children}</div>
      {description ? (
        <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
