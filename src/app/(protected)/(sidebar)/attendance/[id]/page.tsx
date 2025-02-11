import AttendanceDetailView from "@/components/pages/attendance/AttendanceDetailView";
import { notFound } from "next/navigation";
import { getAttendance } from "./actions";
import { Metadata } from "next";
import Header from "@/components/header/Header";

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

  return (
    <div className="w-full">
      <Header
        breadcrumbs={[
          { title: "Home", url: "/" },
          { title: "Attendance", url: `/attendance/${room!.id}` },
        ]}
      />
      <AttendanceDetailView room={room!} />
    </div>
  );
}
