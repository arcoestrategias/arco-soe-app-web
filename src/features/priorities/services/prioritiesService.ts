import { http } from "@/shared/api/http";
import { routes } from "@/shared/api/routes";
import { unwrapAny } from "@/shared/api/response";

import type {
  CreatePriorityDto,
  UpdatePriorityDto,
  ToggleActivePriorityDto,
  FilterPriorityDto,
  Priority,
  PrioritiesListData,
  PriorityIcpSeries,
} from "../types/priority";

export const prioritiesService = {
  async createPriority(payload: CreatePriorityDto): Promise<Priority> {
    const res = await http.post(routes.priorities.create(), payload);
    return unwrapAny<Priority>(res.data);
  },

  async updatePriority(
    id: string,
    payload: UpdatePriorityDto
  ): Promise<Priority> {
    const res = await http.patch(routes.priorities.update(id), payload);
    return unwrapAny<Priority>(res.data);
  },

  async setPriorityActive(
    id: string,
    payload: ToggleActivePriorityDto
  ): Promise<Priority> {
    const res = await http.patch(routes.priorities.toggleActive(id), payload);
    return unwrapAny<Priority>(res.data);
  },

  async getPriorities(params: FilterPriorityDto): Promise<PrioritiesListData> {
    const res = await http.get(routes.priorities.list(), { params });
    return unwrapAny<PrioritiesListData>(res.data);
  },

  icpSeries: async (params: { positionId: string; from: string; to: string }) => {
    const res = await http.get(routes.priorities.icpSeries, { params });
    // res.data es tu Envelope: { success, message, statusCode, data }
    return unwrapAny<PriorityIcpSeries>(res.data); // ← devuelve solo data
  },
};
