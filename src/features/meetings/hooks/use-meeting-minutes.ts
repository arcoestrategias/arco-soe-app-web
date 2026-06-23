import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import {
  getMinutes,
  createMinutes,
  updateMinutes,
  finalizeMinutes,
  createPriorityFromMinutes,
  getParticipantsPerformance,
} from "../services/meetingsService";
import type { MeetingMinutesData } from "../types/meeting-minutes.types";

export function useMeetingMinutesQuery(meetingId: string | undefined) {
  return useQuery({
    queryKey: QKEY.meetingMinutes(meetingId ?? "none"),
    queryFn: () => {
      if (!meetingId) return Promise.resolve(null);
      return getMinutes(meetingId);
    },
    enabled: !!meetingId,
  });
}

export function useCreateMinutesMutation(meetingId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (agenda?: string[]) => {
      if (!meetingId) throw new Error("meetingId requerido");
      return createMinutes(meetingId, agenda);
    },
    onSuccess: () => {
      if (meetingId) {
        qc.invalidateQueries({ queryKey: QKEY.meetingMinutes(meetingId) });
      }
    },
  });
}

export function useUpdateMinutesMutation(meetingId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MeetingMinutesData>) => {
      if (!meetingId) throw new Error("meetingId requerido");
      return updateMinutes(meetingId, data);
    },
    onSuccess: () => {
      if (meetingId) {
        qc.invalidateQueries({ queryKey: QKEY.meetingMinutes(meetingId) });
      }
    },
  });
}

export function useFinalizeMinutesMutation(meetingId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!meetingId) throw new Error("meetingId requerido");
      return finalizeMinutes(meetingId);
    },
    onSuccess: () => {
      if (meetingId) {
        qc.invalidateQueries({ queryKey: QKEY.meetingMinutes(meetingId) });
      }
      qc.invalidateQueries({ queryKey: QKEY.meetings });
    },
  });
}

export function useCreatePriorityMutation(meetingId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      positionId: string;
      name: string;
      description?: string;
      fromAt?: string;
      untilAt?: string;
      status?: "OPE" | "CLO" | "CAN";
      objectiveId?: string;
    }): Promise<any> => {
      if (!meetingId) throw new Error("meetingId requerido");
      return createPriorityFromMinutes(meetingId, payload);
    },
    onSuccess: () => {
      if (meetingId) {
        qc.invalidateQueries({ queryKey: QKEY.meetingMinutes(meetingId) });
      }
    },
  });
}

export function useParticipantsPerformanceQuery(
  meetingId: string | undefined
) {
  return useQuery({
    queryKey: QKEY.participantsPerformance(meetingId ?? "none"),
    queryFn: () => {
      if (!meetingId) return Promise.resolve([]);
      return getParticipantsPerformance(meetingId);
    },
    enabled: !!meetingId,
  });
}
