import AttendanceDetailView from "@/components/pages/attendance/AttendanceDetailView";
import { notFound } from "next/navigation";
import { getAttendance } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Attendance Detail",
  description: "Attendance Detail",
};

export default async function AttendanceDetailPage({ params }: any) {
  const { data: room, error: err } = await getAttendance(
    Number((await params).id)
  );

  if (err) {
    notFound();
  }

  return <AttendanceDetailView room={room!} />;
}
