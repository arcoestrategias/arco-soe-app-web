// src/features/strategic-projects/types/dashboard.ts
export interface StrategicProjectsDashboardSummary {
  totalProjects: number;
  avgCompliance: number; // 8.33
  totalBudget: number; // 0
  totalExecuted: number; // 0
}

export interface StrategicProjectsDashboardProject {
  id: string;
  name: string;
  description: string | null;
  fromAt: string; // ISO
  untilAt: string; // ISO
  budget: number;
  executed: number;
  tasksClosed: number;
  tasksTotal: number;
  compliance: number; // 0..100 con decimales
  objectiveId: string | null;
  objectiveName: string | null;
  factorsTotal: number;
}

export interface StrategicProjectsDashboardData {
  summary: StrategicProjectsDashboardSummary;
  projects: StrategicProjectsDashboardProject[];
}
