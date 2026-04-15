"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { QKEY } from "@/shared/api/query-keys";
import { getPositionsByBusinessUnit } from "@/features/positions/services/positionsService";
import { getExternalUsers, createExternalUser } from "@/features/external-users/services/externalUsersService";
import { getBusinessUnitId } from "@/shared/auth/storage";
import { toast } from "sonner";
import { getHumanErrorMessage } from "@/shared/api/response";
import type { TaskParticipant } from "../types/strategicProjectStructure";
import type { Position } from "@/features/positions/types/positions";
import type { ExternalUser } from "@/features/external-users/services/externalUsersService";

interface TaskParticipantsSelectorProps {
  participants: TaskParticipant[];
  onParticipantsChange: (participants: TaskParticipant[]) => void;
  readOnly?: boolean;
  className?: string;
  businessUnitId?: string;
}

type SelectableItem = {
  id: string;
  type: "internal" | "external";
  label: string;
  sublabel?: string;
  positionId?: string;
  externalUserId?: string;
};

export function TaskParticipantsSelector({
  participants,
  onParticipantsChange,
  readOnly = false,
  className,
  businessUnitId: businessUnitIdProp,
}: TaskParticipantsSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newExternalName, setNewExternalName] = useState("");
  const [newExternalEmail, setNewExternalEmail] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateExternal, setShowCreateExternal] = useState(false);

  const qc = useQueryClient();

  const businessUnitId = businessUnitIdProp ?? getBusinessUnitId();

  const { data: positions = [] } = useQuery({
    queryKey: businessUnitId ? QKEY.positionsByBU(businessUnitId) : ["positions", "bu", "none"],
    queryFn: () => getPositionsByBusinessUnit(businessUnitId!),
    enabled: !!businessUnitId,
    staleTime: 60_000,
  });

  const { data: externalUsers = [] } = useQuery({
    queryKey: QKEY.externalUsers,
    queryFn: getExternalUsers,
    staleTime: 60_000,
  });

  const internalItems = useMemo<SelectableItem[]>(() => {
    return positions.map((pos: Position) => ({
      id: `internal-${pos.id}`,
      type: "internal" as const,
      label: pos.name,
      sublabel: pos.userFullName ?? undefined,
      positionId: pos.id,
    }));
  }, [positions]);

  const externalItems = useMemo<SelectableItem[]>(() => {
    return externalUsers.map((user: ExternalUser) => ({
      id: `external-${user.id}`,
      type: "external" as const,
      label: user.name,
      externalUserId: user.id,
    }));
  }, [externalUsers]);

  const filteredInternal = useMemo(() => {
    if (!search.trim()) return internalItems;
    const lower = search.toLowerCase();
    return internalItems.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        item.sublabel?.toLowerCase().includes(lower)
    );
  }, [internalItems, search]);

  const filteredExternal = useMemo(() => {
    if (!search.trim()) return externalItems;
    const lower = search.toLowerCase();
    return externalItems.filter((item) =>
      item.label.toLowerCase().includes(lower)
    );
  }, [externalItems, search]);

  const isSelected = (item: SelectableItem) => {
    return participants.some((p) => {
      if (item.type === "internal") {
        return p.positionId === item.positionId && p.isActive;
      } else {
        return p.externalUserId === item.externalUserId && p.isActive;
      }
    });
  };

  const handleSelect = (item: SelectableItem) => {
    if (readOnly) return;

    if (item.type === "internal" && item.positionId) {
      const position = positions.find((p: Position) => p.id === item.positionId);
      
      const newParticipant: TaskParticipant = {
        id: `temp-${Date.now()}`,
        taskId: "",
        positionId: item.positionId,
        positionName: position?.name ?? null,
        userId: null,
        userName: position?.userFullName ?? null,
        externalUserId: null,
        externalUserName: null,
        externalUserEmail: null,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      onParticipantsChange([...participants, newParticipant]);
      setOpen(false);
      setSearch("");
      return;
    }

    // Usuario externo
    const externalUser = externalUsers.find((u: ExternalUser) => u.id === item.externalUserId);
    
    const newParticipant: TaskParticipant = {
      id: `temp-${Date.now()}`,
      taskId: "",
      positionId: null,
      positionName: null,
      userId: null,
      userName: null,
      externalUserId: item.externalUserId ?? null,
      externalUserName: item.label, // Usar el nombre del externo
      externalUserEmail: externalUser?.email ?? null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    onParticipantsChange([...participants, newParticipant]);
    setOpen(false);
    setSearch("");
  };

  const handleRemove = (participantId: string) => {
    if (readOnly) return;
    onParticipantsChange(participants.filter((p) => p.id !== participantId));
  };

  const handleCreateExternal = async () => {
    if (!newExternalEmail.trim()) {
      toast.error("El email es requerido");
      return;
    }

    if (!newExternalName.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newExternalEmail.trim())) {
      toast.error("El email no es válido");
      return;
    }

    setIsCreating(true);
    try {
      const newExternal = await createExternalUser({
        name: newExternalName.trim(),
        email: newExternalEmail.trim().toLowerCase(),
      });

      // Invalidar la query de externos para que se actualice la lista
      qc.invalidateQueries({ queryKey: QKEY.externalUsers });

      // Agregar el nuevo externo como participante
      const newParticipant: TaskParticipant = {
        id: `temp-${Date.now()}`,
        taskId: "",
        positionId: null,
        positionName: null,
        userId: null,
        userName: null,
        externalUserId: newExternal.id,
        externalUserName: newExternal.name,
        externalUserEmail: newExternal.email,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      onParticipantsChange([...participants, newParticipant]);
      toast.success("Usuario externo creado y agregado");

      // Limpiar formulario
      setNewExternalName("");
      setNewExternalEmail("");
      setShowCreateExternal(false);
      setSearch("");
      setOpen(false);
    } catch (error) {
      toast.error(getHumanErrorMessage(error, "Error al crear usuario externo"));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selector combobox */}
      {!readOnly && (
        <Popover open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setOpen(true)}
            >
              + Agregar responsable
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0" align="start" sideOffset={0}>
            <Command>
              <CommandInput
                placeholder="Buscar..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandEmpty>No se encontraron resultados.</CommandEmpty>
              
              {/* Sección: Posiciones */}
              {filteredInternal.length > 0 && (
                <div className="py-2">
                  <p className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">
                    Posiciones
                  </p>
                  <CommandGroup>
                    {filteredInternal.map((item) => {
                      const selected = isSelected(item);
                      return (
                        <CommandItem
                          key={item.id}
                          value={`pos-${item.label}`}
                          onSelect={() => !selected && handleSelect(item)}
                          disabled={selected}
                          className={cn(
                            "flex items-center justify-between cursor-pointer",
                            selected && "opacity-50 cursor-not-allowed bg-muted"
                          )}
                        >
                          <div>
                            <p className="text-sm font-medium">{item.label}</p>
                            {item.sublabel && (
                              <p className="text-xs text-muted-foreground">
                                {item.sublabel}
                              </p>
                            )}
                          </div>
                          {selected && (
                            <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded">
                              Agregado
                            </span>
                          )}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </div>
              )}

              {/* Sección: Externos */}
              {filteredExternal.length > 0 && (
                <div className="py-2 border-t">
                  <p className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">
                    Externos
                  </p>
                  <CommandGroup>
                    {filteredExternal.map((item) => {
                      const selected = isSelected(item);
                      return (
                        <CommandItem
                          key={item.id}
                          value={`ext-${item.label}`}
                          onSelect={() => !selected && handleSelect(item)}
                          disabled={selected}
                          className={cn(
                            "flex items-center justify-between cursor-pointer",
                            selected && "opacity-50 cursor-not-allowed bg-muted"
                          )}
                        >
                          <p className="text-sm font-medium">{item.label}</p>
                          {selected && (
                            <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded">
                              Agregado
                            </span>
                          )}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </div>
              )}

              {/* Opción para crear externo (solo si hay búsqueda sin resultados o siempre disponible) */}
              <div className="py-2 border-t">
                {!showCreateExternal ? (
                  <CommandItem
                    value="create-external"
                    onSelect={() => setShowCreateExternal(true)}
                    className="cursor-pointer text-blue-600 hover:text-blue-700"
                  >
                    <span className="text-sm">+ Crear nuevo externo</span>
                  </CommandItem>
                ) : (
                  <div className="p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      Crear nuevo externo
                    </p>
                    <Input
                      placeholder="Nombre"
                      value={newExternalName}
                      onChange={(e) => setNewExternalName(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={newExternalEmail}
                      onChange={(e) => setNewExternalEmail(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-sm"
                        onClick={() => {
                          setShowCreateExternal(false);
                          setNewExternalName("");
                          setNewExternalEmail("");
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-sm bg-orange-500 hover:bg-orange-600"
                        onClick={handleCreateExternal}
                        disabled={isCreating || !newExternalEmail.trim() || !newExternalName.trim()}
                      >
                        {isCreating ? "Creando..." : "Agregar"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {filteredInternal.length === 0 && filteredExternal.length === 0 && !showCreateExternal && (
                <div className="p-4 text-sm text-gray-500 text-center">
                  No hay resultados
                </div>
              )}
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
