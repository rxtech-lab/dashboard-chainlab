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
  const attendants = await getAllAttendant(parseInt((await params).id));
  const attendant = await getAttendantByWalletAddress(session.walletAddress!);
  const todayAttendance = await hasAttendantTakenAttendanceForToday(
    attendant.data?.id!,
    parseInt((await params).id)
  );

  if (attendants.error) {
    return <div>{attendants.error}</div>;
  }

  if (attendant.error) {
    return <div>{attendant.error}</div>;
  }

  if (todayAttendance.error) {
    return <div>{todayAttendance.error}</div>;
  }

  if (todayAttendance.data) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-md lg:bg-white rounded-lg lg:shadow-sm p-8 text-center">
          <AttendanceSuccessMessage
            timestamp={todayAttendance.data.created_at}
          />
          <AttendanceSignOutButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center">
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
