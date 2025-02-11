import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { AttendanceAvatarGroup } from "./AttendanceAvatarGroup";

interface AttendanceRecord {
  id: number;
  created_at: string;
  attendant: {
    first_name: string | null;
    last_name: string | null;
    uid: string;
  } | null;
}

interface AttendanceRecordListProps {
  records: AttendanceRecord[];
  className?: string;
}

export default function AttendanceRecordList({
  records,
  className,
}: AttendanceRecordListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("bg-white rounded-lg p-4", className)}
    >
      <AttendanceAvatarGroup records={records} />
    </motion.div>
  );
}
