// import { useState, useEffect } from "react";
// import { Factor, Task } from "../types/types";
// import { toast } from "sonner";
// import {
//   getFactors,
//   saveFactor as apiSaveFactor,
//   deactivateFactor,
//   updateFactorOrder,
//   deactivateTask,
//   updateTask,
//   createTask,
// } from "../services/projectFactorsService";

// export function useFactorsTasks(projectId: number) {
//   const [factors, setFactors] = useState<Factor[]>([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     loadFactors();
//   }, [projectId]);

//   const loadFactors = async () => {
//     setLoading(true);
//     setFactors([]);
//     try {
//       const data = await getFactors(projectId);
//       setFactors(data.map((f) => ({ ...f, expandido: false })));
//     } catch (err) {
//       toast.error("Error al cargar los factores");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Verifica si hay algún elemento en creación (factor o tarea)
//   const hasItemInCreation = () => {
//     return factors.some(
//       (f) =>
//         f.esNuevo ||
//         f.enEdicion ||
//         f.tareas.some((t) => t.esNuevo || t.enEdicion)
//     );
//   };

//   // 🔹 Factores
//   const toggleExpandFactor = (factorId: number) => {
//     setFactors((prev) =>
//       prev.map((f) =>
//         f.id === factorId ? { ...f, expandido: !f.expandido } : f
//       )
//     );
//   };

//   const toggleExpandAll = () => {
//     const allExpanded = factors.every((f) => f.expandido);
//     setFactors((prev) =>
//       prev.map((f) => ({
//         ...f,
//         expandido: !allExpanded,
//       }))
//     );
//   };

//   const addFactor = () => {
//     if (hasItemInCreation()) return;
//     const newFactor: Factor = {
//       id: 111111111111111111,
//       descripcion: "",
//       resultado: "",
//       expandido: true,
//       enEdicion: true,
//       esNuevo: true,
//       activo: true,
//       tareas: [],
//       orden: factors.length++,
//     };
//     setFactors((prev) => [...prev, newFactor]);
//   };

//   const editFactor = (factorId: number) => {
//     setFactors((prev) =>
//       prev.map((f) => (f.id === factorId ? { ...f, enEdicion: true } : f))
//     );
//   };

//   const saveFactor = async (factor: Factor) => {
//     try {
//       await apiSaveFactor(factor);

//       setFactors((prev) =>
//         prev.map((f) =>
//           f.id === factor.id
//             ? { ...factor, enEdicion: false, esNuevo: false }
//             : f
//         )
//       );

//       toast.success("Factor guardado correctamente");
//     } catch (error) {
//       toast.error("Error al guardar el factor");
//     }
//   };

//   const cancelFactor = (factorId: number, isNew?: boolean) => {
//     if (isNew) {
//       setFactors((prev) => prev.filter((f) => f.id !== factorId));
//     } else {
//       setFactors((prev) =>
//         prev.map((f) => (f.id === factorId ? { ...f, enEdicion: false } : f))
//       );
//     }
//   };

//   const deleteFactor = async (factorId: number) => {
//     try {
//       await deactivateFactor(factorId);
//       toast.success("El factor ha sido desactivado");
//       await loadFactors();
//     } catch (error) {
//       toast.error("Error al desactivar el factor");
//     }
//   };

//   const reorderFactors = async (newOrder: Factor[]) => {
//     const previous = [...factors]; // Clona para comparar luego
//     setFactors(newOrder); // actualiza visualmente

//     try {
//       const prevOrden = previous.map((f) => ({ id: f.id, orden: f.orden }));
//       const newOrden = newOrder.map((f) => ({ id: f.id, orden: f.orden }));

//       // console.log("Orden anterior:", prevOrden);
//       // console.log("Orden nuevo:", newOrden);

//       await updateFactorOrder(newOrden); // enviar solo id + orden
//       toast.success("Se ha guardado el nuevo orden de los factores");
//     } catch (error) {
//       setFactors(previous);
//       toast.error(
//         "No se pudo guardar el nuevo orden. Se ha restaurado el orden anterior."
//       );
//     }
//   };

//   // 🔸 Tareas
//   const addTask = (factorId: number) => {
//     if (hasItemInCreation()) return;
//     setFactors((prev) =>
//       prev.map((f) =>
//         f.id === factorId
//           ? {
//               ...f,
//               expandido: true,
//               tareas: [
//                 ...f.tareas,
//                 {
//                   id: 111111111111111111,
//                   nombre: "",
//                   justificacion: "",
//                   entregable: "",
//                   responsable: "",
//                   apoyos: [],
//                   fechaInicio: "",
//                   fechaFin: "",
//                   inversion: 0,
//                   isFinished: false,
//                   limitacion: "",
//                   observacion: "",
//                   metodologia: "",
//                   enEdicion: true,
//                   esNuevo: true,
//                   orden: f.tareas.length++,
//                   activo: true,
//                 },
//               ],
//             }
//           : f
//       )
//     );
//   };

//   const editTask = (factorId: number, taskId: number) => {
//     setFactors((prev) =>
//       prev.map((f) =>
//         f.id === factorId
//           ? {
//               ...f,
//               tareas: f.tareas.map((t) =>
//                 t.id === taskId ? { ...t, enEdicion: true } : t
//               ),
//             }
//           : f
//       )
//     );
//   };

//   const saveTask = async (factorId: number, task: Task) => {
//     try {
//       if (task.esNuevo) {
//         await createTask(task);
//       } else {
//         await updateTask(task);
//       }

//       setFactors((prev) =>
//         prev.map((f) =>
//           f.id === factorId
//             ? {
//                 ...f,
//                 tareas: f.tareas.map((t) =>
//                   t.id === task.id
//                     ? { ...task, enEdicion: false, esNuevo: false }
//                     : t
//                 ),
//               }
//             : f
//         )
//       );

//       toast.success("Tarea guardada correctamente");
//     } catch (error) {
//       toast.error("Error al guardar la tarea");
//     }
//   };

//   const cancelTask = (factorId: number, taskId: number, isNew?: boolean) => {
//     setFactors((prev) =>
//       prev.map((f) =>
//         f.id === factorId
//           ? {
//               ...f,
//               tareas: isNew
//                 ? f.tareas.filter((t) => t.id !== taskId)
//                 : f.tareas.map((t) =>
//                     t.id === taskId ? { ...t, enEdicion: false } : t
//                   ),
//             }
//           : f
//       )
//     );
//   };

//   const deleteTask = async (factorId: number, taskId: number) => {
//     try {
//       await deactivateTask(factorId, taskId);
//       toast.success("La tarea ha sido eliminada");

//       setFactors((prev) =>
//         prev.map((f) =>
//           f.id === factorId
//             ? {
//                 ...f,
//                 tareas: f.tareas.filter((t) => t.id !== taskId),
//               }
//             : f
//         )
//       );
//     } catch (error) {
//       toast.error("Error al eliminar la tarea");
//     }
//   };

//   const reorderTasks = (factorId: number, newOrder: Task[]) => {
//     setFactors((prev) =>
//       prev.map((f) => (f.id === factorId ? { ...f, tareas: newOrder } : f))
//     );
//   };

//   const countCompletedTasks = (tasks: Task[]) => {
//     return tasks.filter((t) => t.isFinished).length;
//   };

//   return {
//     factors,
//     loading,
//     toggleExpandFactor,
//     toggleExpandAll, // ← aquí la agregas
//     addFactor,
//     editFactor,
//     saveFactor,
//     cancelFactor,
//     deleteFactor,
//     reorderFactors,
//     addTask,
//     editTask,
//     saveTask,
//     cancelTask,
//     deleteTask,
//     reorderTasks,
//     countCompletedTasks,
//     hasItemInCreation,
//   };
// }
