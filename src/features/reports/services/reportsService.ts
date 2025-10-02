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
