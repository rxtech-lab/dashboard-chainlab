import { generatePollUrl } from "@/app/(internal)/(protected)/(sidebar)/polls/actions";
import { Config } from "@/config/config";
import useSWR from "swr";
import { useEffect } from "react";

interface PollUrl {
  qrCode?: string;
  /**
   * The expiration time of the nonce in ISO format
   */
  exp?: string;
  message?: string;
}

export function usePollUrl(pollId: number) {
  const { data, error, isLoading, mutate } = useSWR<PollUrl>(
    `/poll/${pollId}/url`,
    async () => {
      const host = window.location.host;
      const protocol = window.location.protocol;
      const path = await generatePollUrl(pollId);
      if (path.error) {
        throw new Error(path.error);
      }

      if (path.url) {
        const url = new URL(path.url!, `${protocol}//${host}`);
        return {
          qrCode: url.toString(),
          exp: path.exp,
        };
      }
      return {
        message: "Unable to generate QR code. Please try again later.",
      };
    },
    {
      refreshInterval: Config.Poll.nonceExpiration * 1000,
    },
  );

  // Force refresh when URL expires
  useEffect(() => {
    if (data?.exp) {
      const expTime = new Date(data.exp).getTime();
      const now = Date.now();
      const timeUntilExpiration = expTime - now;

      if (timeUntilExpiration > 0) {
        const timer = setTimeout(() => {
          mutate();
        }, timeUntilExpiration);

        return () => clearTimeout(timer);
      }
    }
  }, [data?.exp, mutate]);

  return {
    data,
    error,
    isLoading,
  };
}
