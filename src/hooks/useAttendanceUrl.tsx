import { generateAttendanceUrl } from "@/app/(internal)/(protected)/(sidebar)/attendance/[id]/actions";
import { Config } from "@/config/config";
import useSWR from "swr";
import { useEffect } from "react";

interface AttendanceUrl {
  qrCode?: string;
  /**
   * The expiration time of the nonce in ISO format
   */
  exp?: string;
  message?: string;
}

export function useAttendanceUrl(roomId: number) {
  const { data, error, isLoading, mutate } = useSWR<AttendanceUrl>(
    `/attendance/${roomId}/url`,
    async () => {
      const host = window.location.host;
      const protocol = window.location.protocol;
      const path = await generateAttendanceUrl(roomId);
      if (path.error) {
        throw new Error(path.error);
      }

      if (path.message) {
        return {
          message: path.message,
        };
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
      refreshInterval: Config.Attendance.nonceExpiration * 1000,
    }
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
