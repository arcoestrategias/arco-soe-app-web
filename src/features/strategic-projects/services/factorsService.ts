import { mockFactorsTasks } from "../data/mock-factors-tasks";
import { Factor } from "../types";

export async function getFactors(projectId: number): Promise<Factor[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const activos = (mockFactorsTasks[projectId] || []).filter(
        (f) => f.activo !== false
      );
      resolve(activos);
    }, 600);
  });
}

export async function updateFactorOrder(factors: any[]) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Simulación de guardado de orden:", factors);
      resolve(true);
    }, 500);
  });
}

export async function saveFactor(factor: any) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Guardando factor (simulado):", factor);
      resolve(true);
    }, 600);
  });
}

export async function deactivateFactor(factorId: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Modificar directamente el mock
      for (const projectId in mockFactorsTasks) {
        const factors = mockFactorsTasks[projectId];
        const index = factors.findIndex((f) => f.id === factorId);
        if (index !== -1) {
          mockFactorsTasks[projectId][index].activo = false;
          break;
        }
      }
      console.log("Factor desactivado (simulado):", factorId);
      resolve(true);
    }, 600);
  });
}

export async function deactivateTask(factorId: number, taskId: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const factor = mockFactorsTasks[1]?.find((f) => f.id === factorId);
      if (factor) {
        const tarea = factor.tareas.find((t) => t.id === taskId);
        if (tarea) tarea.activo = false;
      }
      resolve(true);
    }, 600);
  });
}

export async function updateTask(task: any) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Tarea actualizada (simulada):", task);
      resolve(true);
    }, 600);
  });
}

export async function createTask(task: any) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Tarea creada (simulada):", task);
      resolve(true);
    }, 600);
  });
}
