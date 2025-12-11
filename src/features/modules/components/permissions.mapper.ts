// import {
//   PermissionsByModuleGrouped,
//   PermissionGroup,
//   PermissionView,
//   type ApiPermission,
// } from "./permissions.model";

// // Definición de grupos lógicos para la UI y su orden de aparición
// const GROUPS_CONFIG = [
//   {
//     id: "GENERAL",
//     label: "General y Menús",
//     keywords: ["menu", "menuConfig"],
//   },
//   {
//     id: "CRUD",
//     label: "Gestión de Datos (CRUD)",
//     keywords: ["read", "create", "update", "delete", "reorder"],
//   },
//   {
//     id: "VISUALIZATION",
//     label: "Visualización de UI",
//     keywords: ["show", "download"],
//   },
//   {
//     id: "ASSIGNMENTS",
//     label: "Asignaciones y Vínculos",
//     keywords: ["set"],
//   },
//   {
//     id: "INTERACTIONS",
//     label: "Acciones Específicas",
//     keywords: ["addNote", "uploadDocument"],
//   },
//   { id: "AUDIT", label: "Auditoría", keywords: ["audit"] },
// ];

// function getGroupForPermission(permissionKey: string): string {
//   const suffix = permissionKey.split(".").pop()?.toLowerCase() || "";

//   // Casos especiales para 'update' que no son el CRUD genérico
//   if (suffix.startsWith("update") && suffix !== "update") {
//     return "INTERACTIONS";
//   }

//   for (const group of GROUPS_CONFIG) {
//     if (group.keywords.includes(suffix)) {
//       return group.id;
//     }
//     if (group.keywords.some((keyword) => suffix.startsWith(keyword))) {
//       return group.id;
//     }
//   }
//   return "OTHERS"; // Grupo por defecto para los no clasificados
// }

// /**
//  * Transforma la respuesta de la API de permisos en una estructura agrupada
//  * para ser consumida por la modal de selección.
//  * @param apiPermissions Array de permisos proveniente de `GET /modules/:id/permissions`
//  * @returns Un array de grupos de permisos listos para la UI.
//  */
// export function mapApiPermissionsToGroupedView(
//   apiPermissions: ApiPermission[]
// ): PermissionGroup[] {
//   const groups: { [groupId: string]: PermissionView[] } = {};

//   apiPermissions.forEach((perm) => {
//     const [, ...rest] = perm.name.split(".");
//     const suffix = rest.join(".");

//     const groupId = getGroupForPermission(perm.name);
//     if (!groups[groupId]) {
//       groups[groupId] = [];
//     }

//     const label = suffix.replace(/([A-Z])/g, " $1").trim();
//     const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);

//     groups[groupId].push({
//       key: perm.name,
//       label: formattedLabel,
//       description: perm.description || "",
//     });
//   });

//   const result: PermissionGroup[] = [];
//   const groupOrder = [...GROUPS_CONFIG.map((g) => g.id), "OTHERS"];

//   for (const groupId of groupOrder) {
//     if (groups[groupId]) {
//       const groupConfig = GROUPS_CONFIG.find((g) => g.id === groupId);
//       result.push({
//         groupLabel: groupConfig ? groupConfig.label : "Otros Permisos",
//         permissions: groups[groupId],
//       });
//     }
//   }

//   return result;
// }
