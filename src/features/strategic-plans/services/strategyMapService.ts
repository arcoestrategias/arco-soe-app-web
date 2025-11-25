import { http } from "@/shared/api/http";
import { routes } from "@/shared/api/routes";
import { unwrapAny } from "@/shared/api/response";
import type {
  StrategyMapData,
  StrategyMapObjective,
} from "../types/strategy-map";

/**
 * Mapea la respuesta de la API a la estructura que necesita el componente del mapa.
 */
const mapApiResponse = (data: StrategyMapData): StrategyMapObjective[] => {
  return data.listObjectives.map((item) => item.objective);
};

export const strategyMapService = {
  /**
   * Obtiene los objetivos para el mapa estratégico de un plan específico.
   */
  async getStrategyMap(
    strategicPlanId: string
  ): Promise<StrategyMapObjective[]> {
    const res = await http.get(routes.objectives.strategyMap(strategicPlanId));
    const data = unwrapAny<StrategyMapData>(res.data);
    return mapApiResponse(data);
  },
};
