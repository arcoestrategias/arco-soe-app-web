"use client";

import { useEffect, useRef, useState } from "react";

export function useBlockingProgress() {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("Procesando…");
  const [progress, setProgress] = useState(0);
  const ticking = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = (text?: string) => {
    setLabel(text ?? "Procesando…");
    setProgress(0);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    if (ticking.current) clearInterval(ticking.current);
    // avanza de forma “optimista” hasta 90%
    ticking.current = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 1 : p));
    }, 80);
    return () => {
      if (ticking.current) clearInterval(ticking.current);
      ticking.current = null;
    };
  }, [open]);

  const stop = async () => {
    if (ticking.current) {
      clearInterval(ticking.current);
      ticking.current = null;
    }
    setProgress(100);
    await new Promise((r) => setTimeout(r, 350)); // deja ver el 100%
    setOpen(false);
    await new Promise((r) => setTimeout(r, 120)); // pequeño respiro
    setProgress(0);
  };

  const withBlocking = async (text: string, fn: () => Promise<any>) => {
    start(text);
    try {
      await fn();
    } finally {
      await stop();
    }
  };

  // por si quieres actualizar manualmente (p. ej. subidas en chunks)
  const report = (p: number) => setProgress(Math.max(0, Math.min(p, 100)));

  return { open, label, progress, start, stop, withBlocking, report, setLabel };
}
