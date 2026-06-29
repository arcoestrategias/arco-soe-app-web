import { http } from "@/shared/api/http";
import { unwrapAny } from "@/shared/api/response";
import { routes } from "@/shared/api/routes";

export async function patchObjectiveGoal(
  goalId: string,
  payload: {
    realValue?: number | null;
    goalValue?: number | null;
    baseValue?: number | null;
    observation?: string | null;
  },
) {
  const url = routes.objectiveGoals.update(goalId);
  const resp = await http.patch(url, payload);
  return unwrapAny(resp); // resp.data.data
}

export async function getMeasurements(goalId: string) {
  const url = routes.objectiveGoals.measurements(goalId);
  const resp = await http.get(url);
  return unwrapAny<any[]>(resp);
}

export async function saveMeasurements(
  goalId: string,
  measurements: Array<{
    index: number;
    result?: number | null;
    measuredAt?: string;
    observation?: string | null;
    isIgnore?: boolean;
  }>,
) {
  const url = routes.objectiveGoals.measurements(goalId);
  const resp = await http.post(url, { measurements });
  return unwrapAny<any>(resp);
}

export async function updateGoalMeasurementCount(
  goalId: string,
  measurementCount: number,
  applyToFuture: boolean,
) {
  const url = routes.objectiveGoals.measurementCount(goalId);
  await http.patch(url, { measurementCount, applyToFuture });
}
