import ErrorComponent from "@/components/error/ErrorComponent";
import { getAttendance } from "./actions";

export async function generateMetadata({ params }: { params: any }) {
  const attendance = await getAttendance(Number((await params).id));

  if (attendance.error) {
    return {
      title: attendance.error.toString(),
    };
  }

  return {
    title: attendance.data!.alias,
  };
}

export default async function page({ params }: any) {
  const attendance = await getAttendance(Number((await params).id));
  if (attendance.error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <ErrorComponent message={attendance.error.toString()} />
      </div>
    );
  }
  return <div>Attendance</div>;
}
