import http from "@/shared/api/http";
import { routes } from "@/shared/api/routes";
import { unwrapAny } from "@/shared/api/response";
import type {
  Meeting,
  MeetingOccurrence,
  CreateMeetingPayload,
  UpdateMeetingPayload,
} from "../types/meetings.types";

export async function getCalendarOccurrences(params: {
  from: string;
  to: string;
  companyId: string;
  businessUnitId?: string;
  onlyMine?: boolean;
}): Promise<MeetingOccurrence[]> {
  const res = await http.get(routes.meetings.calendar(params));
  return unwrapAny<MeetingOccurrence[]>(res.data);
}

export async function getMyMeetings(params: {
  companyId: string;
}): Promise<Meeting[]> {
  const res = await http.get(routes.meetings.my(params));
  return unwrapAny<Meeting[]>(res.data);
}

export async function getMeetingById(id: string): Promise<Meeting> {
  const res = await http.get(routes.meetings.byId(id));
  return unwrapAny<Meeting>(res.data);
}

export async function createMeeting(
  payload: CreateMeetingPayload
): Promise<Meeting> {
  const res = await http.post(routes.meetings.base(), payload);
  return unwrapAny<Meeting>(res.data);
}

export async function updateMeeting(
  id: string,
  payload: UpdateMeetingPayload
): Promise<Meeting> {
  const res = await http.patch(routes.meetings.byId(id), payload);
  return unwrapAny<Meeting>(res.data);
}

export async function deleteMeeting(
  id: string,
  params: {
    scope: "ONLY_THIS" | "THIS_AND_FUTURE" | "SERIES";
    occurrenceDate?: string;
  }
): Promise<void> {
  await http.delete(routes.meetings.byId(id), { params });
}

export async function executeOccurrence(id: string): Promise<void> {
  await http.patch(routes.meetings.execute(id));
}
