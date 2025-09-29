"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AssocItem = { id: string; name: string };

export function ObjectiveInactivateBlockedModal({
  open,
  message,
  projects = [],
  priorities = [],
  onClose,
}: {
  open: boolean;
  message?: string;
  projects?: AssocItem[];
  priorities?: AssocItem[];
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogTitle className="text-base font-semibold">
          No es posible inactivar el objetivo
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          {message || "El objetivo tiene asociaciones activas."}
        </DialogDescription>

        <div className="mt-3 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">Proyectos asociados</span>
              <Badge variant="secondary">{projects.length}</Badge>
            </div>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin proyectos asociados.
              </p>
            ) : (
              <ul className="list-disc pl-6 space-y-1">
                {projects.map((p) => (
                  <li key={p.id} className="text-sm">
                    {p.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">Prioridades asociadas</span>
              <Badge variant="secondary">{priorities.length}</Badge>
            </div>
            {priorities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin prioridades asociadas.
              </p>
            ) : (
              <ul className="list-disc pl-6 space-y-1">
                {priorities.map((p) => (
                  <li key={p.id} className="text-sm">
                    {p.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Para inactivar este objetivo, primero desvincula o reconfigura las
            asociaciones listadas.
          </p>
        </div>

        <div className="flex justify-end mt-5">
          <Button onClick={onClose}>Entendido</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
