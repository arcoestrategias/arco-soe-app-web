// "use client";

// import { useEffect, useState } from "react";
// import { toast } from "sonner";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Switch } from "@/components/ui/switch";
// import { Label } from "@/components/ui/label";
// import {
//   useModulePermissionsQuery,
//   useSyncModulePermissionsMutation,
// } from "../hooks/use-modules";
// import { STANDARD_ACTIONS } from "@/shared/auth/permissions.constant";

// interface ModalModulePermissionsProps {
//   isOpen: boolean;
//   onClose: () => void;
//   moduleId: string | null;
//   moduleName?: string;
//   moduleShortCode?: string;
// }

// export function ModalModulePermissions({
//   isOpen,
//   onClose,
//   moduleId,
//   moduleName,
//   moduleShortCode,
// }: ModalModulePermissionsProps) {
//   const { data: existingPermissions, isLoading } =
//     useModulePermissionsQuery(moduleId);
//   const syncMutation = useSyncModulePermissionsMutation();

//   // Estado local para manejar las acciones activas
//   const [activeActions, setActiveActions] = useState<Set<string>>(new Set());

//   // Cuando los permisos de la API cargan, inicializamos el estado local
//   useEffect(() => {
//     if (existingPermissions && moduleShortCode) {
//       const active = new Set<string>();
//       for (const perm of existingPermissions) {
//         // Solo añadimos la acción si el permiso está explícitamente activo
//         if (perm.isActive) {
//           const action = perm.name.replace(`${moduleShortCode}.`, "");
//           active.add(action);
//         }
//       }
//       setActiveActions(active);
//     }
//   }, [existingPermissions, moduleShortCode]);

//   const handleToggle = (action: string, checked: boolean) => {
//     setActiveActions((prev) => {
//       const next = new Set(prev);
//       if (checked) {
//         next.add(action);
//       } else {
//         next.delete(action);
//       }
//       return next;
//     });
//   };

//   const handleSaveChanges = () => {
//     if (!moduleId || !moduleShortCode) return;

//     // Construimos el payload para la API, incluyendo TODAS las acciones estándar
//     const payloadPermissions = STANDARD_ACTIONS.map((action) => {
//       const name = `${moduleShortCode}.${action}`;
//       const isActive = activeActions.has(action);

//       // Buscamos si el permiso ya existía para enviar su ID
//       const existing = existingPermissions?.find((p) => p.name === name);

//       return {
//         id: existing?.id,
//         name,
//         isActive,
//       };
//     });

//     syncMutation.mutate(
//       {
//         moduleId,
//         payload: { permissions: payloadPermissions },
//       },
//       {
//         onSuccess: () => {
//           toast.success("Permisos del módulo actualizados correctamente.");
//           onClose();
//         },
//         onError: (error) => {
//           toast.error("Error al guardar los permisos: " + error.message);
//         },
//       }
//     );
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-[700px]">
//         <DialogHeader>
//           <DialogTitle>Permisos del Módulo: {moduleName}</DialogTitle>
//           <DialogDescription>
//             Habilita o deshabilita las acciones disponibles para este módulo.
//           </DialogDescription>
//         </DialogHeader>

//         <div className="py-4 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
//           {isLoading || !moduleShortCode ? (
//             <p className="text-sm text-muted-foreground col-span-full">
//               Cargando permisos...
//             </p>
//           ) : (
//             STANDARD_ACTIONS.map((action) => (
//               <div key={action} className="flex items-center space-x-2">
//                 <Switch
//                   id={`${moduleShortCode}-${action}`}
//                   checked={activeActions.has(action)}
//                   onCheckedChange={(checked) => handleToggle(action, checked)}
//                 />
//                 <Label htmlFor={`${moduleShortCode}-${action}`}>{action}</Label>
//               </div>
//             ))
//           )}
//         </div>
//         <DialogFooter>
//           <Button variant="outline" onClick={onClose}>
//             Cancelar
//           </Button>
//           <Button onClick={handleSaveChanges} disabled={syncMutation.isPending}>
//             {syncMutation.isPending ? "Guardando..." : "Guardar Cambios"}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }
