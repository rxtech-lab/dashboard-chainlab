import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Add color combinations array
const avatarColors = [
  { bg: "bg-blue-100", text: "text-blue-600" },
  { bg: "bg-green-100", text: "text-green-600" },
  { bg: "bg-purple-100", text: "text-purple-600" },
  { bg: "bg-pink-100", text: "text-pink-600" },
  { bg: "bg-yellow-100", text: "text-yellow-600" },
  { bg: "bg-indigo-100", text: "text-indigo-600" },
];

interface AttendanceRecord {
  id: number;
  created_at: string;
  attendant: {
    first_name: string | null;
    last_name: string | null;
    uid: string;
  } | null;
}

interface AttendanceAvatarGroupProps {
  records: AttendanceRecord[];
  limit?: number;
  className?: string;
}

export function AttendanceAvatarGroup({
  records,
  className,
}: Omit<AttendanceAvatarGroupProps, "limit">) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {records.map((record, index) => (
        <Tooltip key={`${record.id}-${index}`}>
          <TooltipTrigger>
            <div className="relative inline-block ml-[-15px]">
              <div
                className={cn(
                  "w-8 h-8 rounded-full border-2 border-white flex items-center justify-center hover:z-10 transition-transform hover:scale-110",
                  avatarColors[index % avatarColors.length].bg
                )}
              >
                <span
                  className={cn(
                    "text-sm font-medium",
                    avatarColors[index % avatarColors.length].text
                  )}
                >
                  {record.attendant?.first_name?.[0] ||
                    record.attendant?.uid[0] ||
                    "?"}
                </span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium">
                {record.attendant
                  ? `${record.attendant.first_name || ""} ${
                      record.attendant.last_name || ""
                    }`.trim()
                  : "Unknown"}
              </div>
              <div className="text-xs text-gray-400">
                {dayjs(record.created_at).format("HH:mm:ss")}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
