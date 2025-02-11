import { getAttendanceRecordByRoomId } from "@/app/(internal)/(protected)/(sidebar)/attendance/[id]/actions";
import { Config } from "@/config/config";
import useSWR from "swr";

export function useAttendanceRecord(id: number) {
  const { data, error, isLoading, isValidating } = useSWR(
    `/api/attendance-record/${id}`,
    async () => {
      const { data, count, error } = await getAttendanceRecordByRoomId(id);
      if (error) throw error;
      return {
        data,
        count,
      };
    },
    {
      refreshInterval: Config.Attendance.dataAutoRefreshInterval,
    }
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
  };
}
