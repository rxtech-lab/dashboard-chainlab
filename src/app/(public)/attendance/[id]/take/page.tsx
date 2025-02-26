import { AttendanceSuccessMessage } from "@/components/pages/attendance-take/AttendanceSuccessMessage";
import AttendantWalletList from "@/components/pages/attendance-take/AttendantWalletList";
import AttendanceSignOutButton from "@/components/pages/attendance-take/SignOutButton";
import { getAttendantSession } from "@/lib/attendance";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { Metadata } from "next";
import { cookies } from "next/headers";
import {
  getAllAttendant,
  getAttendantByWalletAddress,
  getAttendantByWalletAddressForRoom,
  hasAttendantTakenAttendanceForToday,
} from "./actions";

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export const metadata: Metadata = {
  title: "Take Attendance",
};

export default async function TakeAttendancePage({ params }: { params: any }) {
  const cookieStore = await cookies();
  const session = await getAttendantSession(cookieStore);
  const roomId = parseInt((await params).id);
  const attendants = await getAllAttendant(roomId);

  // Pass roomId to only get attendant if they belong to this room
  const attendant = await getAttendantByWalletAddress(
    session.walletAddress!,
    roomId
  );

  const todayAttendance = await hasAttendantTakenAttendanceForToday(
    attendant.data?.id!,
    roomId
  );

  if (attendants.error) {
    return <div>Attendants not found: {attendants.error}</div>;
  }

  if (attendant.error) {
    return <div>Attendant not found: {attendant.error}</div>;
  }

  if (todayAttendance.error) {
    return <div>Today's attendance not found: {todayAttendance.error}</div>;
  }

  if (todayAttendance.data) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-md lg:bg-white rounded-lg lg:shadow-sm p-8 text-center">
          <AttendanceSuccessMessage
            timestamp={todayAttendance.data.createdAt.toISOString()}
          />
          <AttendanceSignOutButton />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center"
      data-testid="take-attendance-page"
    >
      <div className="w-full max-w-md mx-auto lg:bg-white rounded-lg lg:shadow-sm p-8 min-h-screen lg:min-h-[28rem] flex flex-col">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Take Attendance</h1>
          <p className="mt-2 text-sm text-gray-600">
            Please verify your attendance using your wallet
          </p>
        </div>
        <AttendantWalletList
          attendants={attendants.data ?? []}
          user={attendant.data!}
        />
      </div>
    </div>
  );
}
