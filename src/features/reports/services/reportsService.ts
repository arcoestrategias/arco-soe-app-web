// src/features/reports/services/reportsService.ts
import { http } from "@/shared/api/http"; // tu axios con interceptores
import { routes } from "@/shared/api/routes";

// Tip: tipado del payload para evitar “cargar basura”
export type StrategicPlanDefinitionsReportPayload = {
  companyId?: string;
  businessUnitId?: string;
  strategicPlan: {
    id: string;
    name: string;
    periodStart: string; // YYYY-MM-DD
    periodEnd: string; // YYYY-MM-DD
    mission: string;
    vision: string;
    competitiveAdvantage?: string | null;
  };
  successFactors: Array<{
    id: string;
    name: string;
    order?: number;
    isActive?: boolean;
  }>;
  strategicValues: Array<{
    id: string;
    name: string;
    order?: number;
    isActive?: boolean;
  }>;
  objectives: Array<{
    id: string;
    name: string;
    order?: number;
    isActive?: boolean;
  }>;
  strategicProjects: Array<{
    id: string;
    name: string;
    order?: number;
    isActive?: boolean;
  }>;
};

// Estándar: devolver SIEMPRE res.data (ArrayBuffer) para que el caller no tenga
// que diferenciar AxiosResponse vs dato crudo.
export async function exportStrategicPlanDefinitionsPDF(
  payload: StrategicPlanDefinitionsReportPayload
): Promise<ArrayBuffer> {
  const res = await http.post<ArrayBuffer>(
    routes.reports.strategicPlanDefinitionsPdf(),
    payload,
    { responseType: "arraybuffer" }
  );
  return res.data;
}

export type PrioritiesReportPayload = {
  companyId?: string;
  businessUnitId?: string;
  positionId: string;
  strategicPlan: {
    id: string;
    name: string;
    periodStart: string; // YYYY-MM-DD
    periodEnd: string; // YYYY-MM-DD
    mission: string;
    vision: string;
    competitiveAdvantage?: string | null;
  };
  icp: {
    month: number;
    year: number;
    positionId: string;
    totalPlanned: number;
    totalCompleted: number;
    icp: number | null;
    notCompletedPreviousMonths: number;
    notCompletedOverdue: number;
    inProgress: number;
    completedPreviousMonths: number;
    completedLate: number;
    completedInOtherMonth: number;
    completedOnTime: number;
    canceled: number;
    completedEarly: number;
  };
  priorities: Array<any>;
};

export async function exportPrioritiesPDF(
  payload: PrioritiesReportPayload
): Promise<ArrayBuffer> {
  const res = await http.post<ArrayBuffer>(
    routes.reports.prioritiesPdf(),
    payload,
    { responseType: "arraybuffer" }
  );
  return res.data;
}

type StrategicProjectsReportPayload = {
  businessUnitId: string;
  positionId: string;
  projectId: string;
  strategicPlan: {
    id: string;
    name: string;
    periodStart: string; // YYYY-MM-DD
    periodEnd: string; // YYYY-MM-DD
    mission?: string;
    vision?: string;
    competitiveAdvantage?: string;
  };
};

export async function exportStrategicProjectsPDF(
  payload: StrategicProjectsReportPayload
): Promise<ArrayBuffer> {
  const res = await http.post<ArrayBuffer>(
    routes.reports.strategicProjectsPdf(),
    payload,
    { responseType: "arraybuffer" }
  );

  return res.data;
}
