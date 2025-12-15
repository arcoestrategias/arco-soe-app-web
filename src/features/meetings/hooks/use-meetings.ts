import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import {
  getCalendarOccurrences,
  getMyMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  executeOccurrence,
} from "../services/meetingsService";
import type {
  CreateMeetingPayload,
  UpdateMeetingPayload,
} from "../types/meetings.types";

export function useCalendarOccurrencesQuery(
  from: string,
  to: string,
  companyId: string,
  businessUnitId?: string,
  onlyMine?: boolean
) {
  return useQuery({
    queryKey: QKEY.meetingsCalendar(
      from,
      to,
      companyId,
      businessUnitId,
      onlyMine
    ),
    queryFn: () =>
      getCalendarOccurrences({ from, to, companyId, businessUnitId, onlyMine }),
    enabled: !!from && !!to && !!companyId,
  });
}

export function useMyMeetingsQuery(companyId: string) {
  return useQuery({
    queryKey: QKEY.meetingsMy(companyId),
    queryFn: () => getMyMeetings({ companyId }),
    enabled: !!companyId,
  });
}

export function useMeetingByIdQuery(id: string | null) {
  return useQuery({
    queryKey: QKEY.meeting(id!),
    queryFn: () => getMeetingById(id!),
    enabled: !!id,
  });
}

export function useCreateMeetingMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMeetingPayload) => createMeeting(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.meetings });
    },
  });
}

export function useUpdateMeetingMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateMeetingPayload;
    }) => updateMeeting(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.meetings });
    },
  });
}

export function useDeleteMeetingMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      params,
    }: {
      id: string;
      params: {
        scope: "ONLY_THIS" | "THIS_AND_FUTURE" | "SERIES";
        occurrenceDate?: string;
      };
    }) => deleteMeeting(id, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.meetings });
    },
  });
}

export function useExecuteOccurrenceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (occurrenceId: string) => executeOccurrence(occurrenceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.meetings });
    },
  });
}
