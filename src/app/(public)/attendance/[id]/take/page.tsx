import AttendantWalletList from "@/components/pages/attendance-take/AttendantWalletList";
import { Metadata } from "next";
import {
  getAllAttendant,
  getAttendantByWalletAddress,
  hasAttendantTakenAttendanceForToday,
} from "./actions";
import { cookies } from "next/headers";
import { getAttendantSession } from "@/lib/attendance";
import { Check } from "lucide-react";
import dayjs from "dayjs";
import AttendanceSignOutButton from "@/components/pages/attendance-take/SignOutButton";

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
          <div className="mb-6">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Attendance Recorded at <br />
            {dayjs(todayAttendance.data.created_at).format("DD/MM/YYYY HH:mm")}
          </h2>
          <p className="text-gray-600 mb-2">
            You have already taken attendance for today
          </p>

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
