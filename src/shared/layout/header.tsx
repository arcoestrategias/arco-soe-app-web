// src/shared/layout/header.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HeaderProps } from "@/shared/layout/types";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getHumanErrorMessage } from "@/shared/api/response";
import { toast } from "sonner";
import { setBusinessUnitId } from "../auth/storage";
import { NotificationBell } from "@/features/notifications/components/notification-bell";

export function Header({
  currentPageTitle,
  userName,
  userEmail,
  onLogout,
  isCollapsed = false,
}: HeaderProps) {
  const router = useRouter();

  // 👇 Tu AuthContext actual: reusamos lo que ya expones
  const { me, businessUnits, reloadMe, loading, logout } = useAuth();

  const resolvedName =
    userName ?? me?.firstName
      ? `${me?.firstName ?? ""} ${me?.lastName ?? ""}`.trim()
      : "Usuario";
  const resolvedEmail = userEmail ?? me?.email ?? "";
  const initials = (resolvedName || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hasMultipleBU = (businessUnits?.length ?? 0) > 1;
  const currentBU = me?.currentBusinessUnit?.id ?? "";
  const [buValue, setBuValue] = useState<string>(currentBU);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setBuValue(currentBU);
  }, [currentBU]);

  const handleChangeBU = async (nextId: string) => {
    if (!nextId || nextId === currentBU) return;
    setPending(true);
    const prev = buValue;
    setBuValue(nextId); // optimista

    try {
      // 1) persistir ID de BU
      setBusinessUnitId(nextId);
      // 2) volver a pedir /users/me (actualiza permisos/ámbito)
      await reloadMe();
      // 3) toast
      const name =
        businessUnits?.find((b) => b.id === nextId)?.name ?? "unidad";
      toast.success(`Unidad de negocio cambiada a "${name}"`);
      // 4) refrescar UI (App Router). Fallback a hard reload si no estás en App Router.
      try {
        router.refresh();
      } catch {
        window.location.reload();
      }
    } catch (err) {
      setBuValue(prev); // revertir
      toast.error(getHumanErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-white border-b border-gray-200 transition-all duration-300 ease-in-out font-system ${
        isCollapsed ? "left-16" : "left-64"
      }`}
    >
      <div className="flex items-center justify-between h-full px-6">
        <h1 className="text-sm text-gray-900 nav-text-optimized">
          {currentPageTitle}
        </h1>

        <div className="flex items-center gap-3">
          {/* <ShowIfAccess module="notification" action="access">
            <NotificationBell />
          </ShowIfAccess> */}
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar className="h-9 w-9 border-2 border-gray-200 hover:border-[#FF6B35] transition-colors">
                  <AvatarImage alt={resolvedName} />
                  <AvatarFallback className="bg-gradient-to-r from-[#FF6B35] to-[#E55A2B] text-white font-semibold text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-56 font-system"
              align="end"
              forceMount
            >
              {/* Encabezado con datos del usuario */}
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-xs leading-none nav-text-optimized">
                  {resolvedName}
                </p>
                <p className="text-[10px] leading-none text-gray-500 text-small-optimized">
                  {resolvedEmail}
                </p>
              </div>

              {/* Selector de Unidad de Negocio (solo si hay >1) */}
              {hasMultipleBU && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 w-full">
                    <p className="text-[10px] text-gray-500 mb-1">
                      Unidad de negocio
                    </p>
                    <Select
                      value={buValue}
                      onValueChange={handleChangeBU}
                      disabled={loading || pending}
                    >
                      <SelectTrigger className="h-8 w-full">
                        <SelectValue
                          placeholder={
                            me?.currentBusinessUnit?.name ?? "Selecciona unidad"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="w-[var(--radix-select-trigger-width)]">
                        {businessUnits?.map((bu) => (
                          <SelectItem key={bu.id} value={bu.id}>
                            {bu.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem className="cursor-pointer text-xs text-optimized">
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-xs text-optimized">
                Configuración
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-xs text-red-600 focus:text-red-600 text-optimized"
                onClick={onLogout || logout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
