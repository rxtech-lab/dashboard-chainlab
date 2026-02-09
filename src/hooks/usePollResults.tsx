import { getPollResults } from "@/app/(internal)/(protected)/(sidebar)/polls/actions";
import { Config } from "@/config/config";
import useSWR from "swr";
import type { PollResultsData } from "@/components/pages/polls/poll.types";

export function usePollResults(id: number) {
  const { data, error, isLoading, isValidating } = useSWR<PollResultsData>(
    `/api/poll-results/${id}`,
    async () => {
      const { data, error } = await getPollResults(id);
      if (error) throw error;
      return data!;
    },
    {
      refreshInterval: Config.Poll.dataAutoRefreshInterval,
    },
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
  };
}
