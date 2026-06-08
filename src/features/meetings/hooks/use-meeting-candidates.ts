import { useQuery } from "@tanstack/react-query";
import { QKEY } from "@/shared/api/query-keys";
import { getMeetingCandidates } from "../services/meetingsService";
import { getCompanyId } from "@/shared/auth/storage";

export function useMeetingCandidates() {
  const companyId = getCompanyId();

  const { data: groups = [], isLoading } = useQuery({
    queryKey: QKEY.meetingCandidates(companyId ?? ""),
    queryFn: () => getMeetingCandidates(companyId!),
    enabled: !!companyId,
  });

  return { groups, isLoading };
}
