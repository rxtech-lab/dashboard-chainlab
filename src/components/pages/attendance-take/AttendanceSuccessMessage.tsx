'use client';

import { Check } from "lucide-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

interface AttendanceSuccessMessageProps {
  timestamp: string;
}

export function AttendanceSuccessMessage({ timestamp }: AttendanceSuccessMessageProps) {
  // Convert the UTC timestamp to local timezone
  const localTime = dayjs(timestamp).local();

  return (
    <>
      <div className="mb-6">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="w-6 h-6 text-green-600" />
        </div>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Attendance Recorded at <br />
        {localTime.format("DD/MM/YYYY HH:mm")}
      </h2>
      <p className="text-gray-600 mb-2">
        You have already taken attendance for today
      </p>
    </>
  );
} 