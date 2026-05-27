import { useQuery } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import { getMeetingCandidates } from "../services/meetingsService";
import { getCompanyId } from "@/shared/auth/storage";

export function useMeetingCandidates() {
  const companyId = getCompanyId();

  const { data, isLoading } = useQuery({
    queryKey: QKEY.meetingCandidates(companyId || "none"),
    queryFn: () => {
      if (!companyId) return Promise.resolve([]);
      return getMeetingCandidates(companyId);
    },
    enabled: !!companyId,
  });

  return {
    groups: data ?? [],
    isLoading,
  };
}
