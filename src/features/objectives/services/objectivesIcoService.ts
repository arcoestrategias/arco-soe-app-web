// features/objectives/services/objectivesIcoService.ts
import { http } from "@/shared/api/http";
import { routes } from "@/shared/api/routes";
import { unwrapAny } from "@/shared/api/response";
import { IcoBoardResponse } from "../types/ico-board";

// Mantén el nombre del DTO simple y consistente con priorities
export type GetIcoBoardParams = {
  strategicPlanId: string;
  positionId: string;
  fromYear: number | string;
  toYear: number | string;
};

export async function getObjectivesIcoBoard(
  params: GetIcoBoardParams
): Promise<IcoBoardResponse> {
  // usa qs desde routes helper (patrón priorities)
  const url = routes.objectives.icoBoard();
  const query = `?strategicPlanId=${encodeURIComponent(
    params.strategicPlanId
  )}&positionId=${encodeURIComponent(
    params.positionId
  )}&fromYear=${encodeURIComponent(
    String(params.fromYear)
  )}&toYear=${encodeURIComponent(String(params.toYear))}`;

  const res = await http.get(url + query);
  return unwrapAny<IcoBoardResponse>(res.data);
}
