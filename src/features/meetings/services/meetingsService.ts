import http from "@/shared/api/http";
import { routes } from "@/shared/api/routes";
import { unwrapAny } from "@/shared/api/response";
import type {
  Meeting,
  CreateMeetingPayload,
  UpdateMeetingPayload,
  MeetingCandidatesGroup,
} from "../types/meetings.types";
import type {
  MinutesResponse,
  MeetingMinutesData,
  ParticipantPerformance,
} from "../types/meeting-minutes.types";

export async function getCalendarEvents(params: {
  from: string;
  to: string;
  companyId: string;
  businessUnitId?: string;
  onlyMine?: boolean;
}) {
  const res = await http.get(routes.meetings.calendar(params));
  return unwrapAny<any[]>(res.data);
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
  id: string
): Promise<void> {
  await http.delete(routes.meetings.byId(id));
}

export async function getMeetingCandidates(
  companyId: string
): Promise<MeetingCandidatesGroup[]> {
  const res = await http.get(routes.meetings.candidates(companyId));
  return unwrapAny<MeetingCandidatesGroup[]>(res.data);
}

// ---- Minutes (Actas) ----

export async function getMinutes(
  meetingId: string
): Promise<MinutesResponse | null> {
  const res = await http.get(routes.meetings.minutes(meetingId));
  return unwrapAny<MinutesResponse | null>(res.data) ?? null;
}

export async function createMinutes(
  meetingId: string,
  agenda?: string[]
): Promise<MinutesResponse> {
  const res = await http.post(routes.meetings.minutes(meetingId), { agenda });
  return unwrapAny<MinutesResponse>(res.data);
}

export async function updateMinutes(
  meetingId: string,
  data: Partial<MeetingMinutesData>
): Promise<MinutesResponse> {
  const res = await http.patch(routes.meetings.minutes(meetingId), data);
  return unwrapAny<MinutesResponse>(res.data);
}

export async function finalizeMinutes(
  meetingId: string
): Promise<MinutesResponse> {
  const res = await http.post(routes.meetings.minutesFinalize(meetingId));
  return unwrapAny<MinutesResponse>(res.data);
}

export async function getMinutesVersions(
  meetingId: string
): Promise<MinutesResponse[]> {
  const res = await http.get(routes.meetings.minutesVersions(meetingId));
  return unwrapAny<MinutesResponse[]>(res.data);
}

export async function createPriorityFromMinutes(
  meetingId: string,
  payload: {
    positionId: string;
    name: string;
    description?: string;
    fromAt?: string;
    untilAt?: string;
    status?: "OPE" | "CLO" | "CAN";
    objectiveId?: string;
  }
): Promise<any> {
  const res = await http.post(routes.meetings.createPriority(meetingId), payload);
  return unwrapAny<any>(res.data);
}

export async function getParticipantsPerformance(
  meetingId: string
): Promise<ParticipantPerformance[]> {
  const res = await http.get(routes.meetings.participantsPerformance(meetingId));
  return unwrapAny<ParticipantPerformance[]>(res.data);
}
