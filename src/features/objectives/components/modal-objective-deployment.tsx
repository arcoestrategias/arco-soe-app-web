"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ResponsibilityType } from "../types/deployment-matrix";
import {
  useAssignResponsibility,
  useDeleteResponsibility,
} from "../hooks/use-deployment-matrix";
import { toast } from "sonner";
import { getHumanErrorMessage } from "@/shared/api/response";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DeploymentModalData = {
  objectiveId: string;
  objectiveName: string;
  positionId: string;
  positionName: string;
  relationId?: string;
  currentType?: ResponsibilityType | null;
  availablePositions?: { id: string; name: string }[];
  relations?: any;
};

type Props = {
  open: boolean;
  onClose: () => void;
  data: DeploymentModalData | null;
};

const OPTIONS = [
  {
    value: ResponsibilityType.IMPUTABLE,
    label: "Responsable Imputable",
    description:
      "Dueño del objetivo, rinde cuentas por su cumplimiento. (Solo uno por objetivo).",
    letter: "I",
    dotClass:
      "bg-gradient-to-br from-[var(--soe-grad-from)] to-[var(--soe-grad-to)] text-white shadow-md border-0",
  },
  {
    value: ResponsibilityType.SUPPORT,
    label: "Soporte",
    description: "Colabora activamente en la ejecución o aporta recursos.",
    letter: "S",
    dotClass: "bg-[#ffa466]/20 text-[#f25c4c] border-2 border-[#f25c4c]/40",
  },
  {
    value: ResponsibilityType.INFORMED,
    label: "Informado / Consultado",
    description:
      "Debe ser notificado o consultado sobre avances o decisiones clave.",
    letter: "C",
    dotClass: "bg-white text-[#f25c4c] border-2 border-[#ffa466]/70",
  },
  {
    value: "NONE",
    label: "Sin asignación",
    description: "Esta posición no tiene un rol directo en este objetivo.",
    letter: "-",
    dotClass: "bg-slate-100 text-slate-400 border-2 border-slate-200",
  },
];

export function ModalObjectiveDeployment({ open, onClose, data }: Props) {
  const [selectedType, setSelectedType] = useState<string>("NONE");
  const [selectedPositionId, setSelectedPositionId] = useState<string>("");
  const [currentRelationId, setCurrentRelationId] = useState<string | undefined>(undefined);

  const assignMut = useAssignResponsibility();
  const deleteMut = useDeleteResponsibility();

  useEffect(() => {
    if (open && data) {
      setSelectedType(data.currentType ?? "NONE");
      setSelectedPositionId(data.positionId);
      setCurrentRelationId(data.relationId);
    }
  }, [open, data]);

  const handlePositionChange = (val: string) => {
    setSelectedPositionId(val);

    // Si no enviaron relaciones (ej. uso directo desde la matriz), usamos fallback básico
    if (!data?.relations) {
      if (val !== data?.positionId) {
        setSelectedType("NONE");
        setCurrentRelationId(undefined);
      } else {
        setSelectedType(data?.currentType ?? "NONE");
        setCurrentRelationId(data?.relationId);
      }
      return;
    }

    // Busca si la nueva posición seleccionada ya tiene una responsabilidad guardada
    const rels: any = data.relations;
    const relation = Array.isArray(rels)
      ? rels.find((r: any) => r.positionId === val)
      : rels?.[val];

    if (relation?.type) {
      setSelectedType(String(relation.type).toUpperCase());
      setCurrentRelationId(relation.relationId);
    } else {
      setSelectedType("NONE");
      setCurrentRelationId(undefined);
    }
  };

  const handleSave = () => {
    if (!data) return;

    if (selectedType === "NONE") {
      if (currentRelationId) {
        deleteMut.mutate(currentRelationId, {
          onSuccess: () => {
            toast.success("Responsabilidad removida.");
            onClose();
          },
          onError: (err) => toast.error(getHumanErrorMessage(err)),
        });
      } else {
        onClose(); // No había asignación y eligió "Nada", no hacemos nada
      }
    } else {
      // Asignar o reasignar (el backend se encarga del upsert)
      assignMut.mutate(
        {
          objectiveId: data.objectiveId,
          positionId: selectedPositionId,
          type: selectedType,
        },
        {
          onSuccess: () => {
            toast.success("Responsabilidad asignada.");
            onClose();
          },
          onError: (err) => toast.error(getHumanErrorMessage(err)),
        },
      );
    }
  };

  const isLoading = assignMut.isPending || deleteMut.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Responsabilidad</DialogTitle>
          <DialogDescription className="mt-2 text-slate-600">
            Define el rol en el objetivo:
            <br />
            <span className="font-medium text-slate-900 mt-1 block">
              "{data?.objectiveName}"
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4">
          {data?.availablePositions && data.availablePositions.length > 0 ? (
            <div className="space-y-2">
              <Label>Posición a asignar:</Label>
              <Select
                value={selectedPositionId}
                onValueChange={handlePositionChange}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Seleccione una posición" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[9999] max-h-60">
                  {data.availablePositions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-sm text-slate-700">
              Posición:{" "}
              <span className="font-semibold">{data?.positionName}</span>
            </p>
          )}

          <RadioGroup
            value={selectedType}
            onValueChange={setSelectedType}
            className="flex flex-col space-y-3"
          >
            {OPTIONS.map((opt) => (
              <Label
                key={opt.value}
                htmlFor={`role-${opt.value}`}
                className={`flex items-start gap-4 p-3 border rounded-xl cursor-pointer transition-colors shadow-sm ${
                  selectedType === opt.value
                    ? "border-[#f25c4c] bg-[#ffa466]/5"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <RadioGroupItem
                  value={opt.value}
                  id={`role-${opt.value}`}
                  className="mt-1"
                />
                <div className="flex items-center gap-3 w-full">
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold shrink-0 ${opt.dotClass}`}
                  >
                    {opt.letter}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span
                      className={`text-sm font-semibold ${selectedType === opt.value ? "text-[#f25c4c]" : "text-slate-800"}`}
                    >
                      {opt.label}
                    </span>
                    <span className="text-xs text-slate-500 font-normal leading-snug">
                      {opt.description}
                    </span>
                  </div>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="btn-gradient"
          >
            {isLoading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
