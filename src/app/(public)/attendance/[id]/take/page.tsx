import AttendantWalletList from "@/components/pages/attendance-take/AttendantWalletList";
import { Metadata } from "next";
import { getAllAttendant } from "./actions";

export const metadata: Metadata = {
  title: "Take Attendance",
};

export default async function TakeAttendancePage({ params }: { params: any }) {
  const attendants = await getAllAttendant(parseInt(params.id));
  if (attendants.error) {
    return <div>{attendants.error}</div>;
  }
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1>Take Attendance</h1>
      <AttendantWalletList attendants={attendants.data ?? []} />
    </div>
  );
}
