import { http } from "@/shared/api/http";
import { unwrapAny } from "@/shared/api/response";
import { routes } from "@/shared/api/routes";

export async function patchObjectiveGoal(
  goalId: string,
  payload: {
    realValue?: number | null;
    goalValue?: number | null;
    observation?: string | null;
  }
) {
  const url = routes.objectiveGoals.update(goalId);
  const resp = await http.patch(url, payload);
  return unwrapAny(resp); // resp.data.data
}
