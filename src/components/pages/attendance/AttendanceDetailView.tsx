"use client";

import { refreshNonce } from "@/app/(internal)/(protected)/(sidebar)/attendance/[id]/actions";
import { updateAttendanceRoom } from "@/app/(internal)/(protected)/actions";
import Spinner from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { useAttendanceRecord } from "@/hooks/useAttendanceRecord";
import { useAttendanceUrl } from "@/hooks/useAttendanceUrl";
import { AttendanceRoom } from "@prisma/client";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useSWRConfig } from "swr";
import AttendanceRecordList from "../../attendance/AttendanceRecordList";
import { Card } from "../../ui/card";
import RoomActions from "./RoomActions";

const QRCodePanel = dynamic(
  () => import("../../attendance/QRCodePanel").then((mod) => mod.default),
  {
    ssr: false,
  }
);

interface AttendanceDetailViewProps {
  room: AttendanceRoom;
}

export default function AttendanceDetailView({
  room,
}: AttendanceDetailViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(room.isOpen);
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const { data: attendanceRecord, isLoading: isLoadingAttendanceRecord } =
    useAttendanceRecord(room.id);

  const handleToggle = async () => {
    setIsLoading(true);

    if (!isOpen) {
      const { error } = await refreshNonce(room.id);
      if (error) {
        toast.toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }
    }
    const { error } = await updateAttendanceRoom(room.id, {
      isOpen: !isOpen,
    }).finally(() => {
      setIsLoading(false);
    });

    if (error) {
      toast.toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      setIsOpen(!isOpen);
      mutate(`/attendance/${room.id}/url`);
      toast.toast({
        title: "Success",
        description: "Attendance room status updated successfully",
        variant: "success",
      });
    }
  };

  const { data: takeAttendanceUrl, isLoading: isLoadingTakeAttendanceUrl } =
    useAttendanceUrl(room.id);

  return (
    <div className="max-w-7xl mx-auto p-6 w-full mt-10">
      <div className="block mb-10 md:hidden">
        <RoomActions
          roomId={room.id}
          roomAlias={room.alias}
          isDisabled={isLoading}
          isLoading={isLoading}
          isOpen={isOpen}
          handleToggle={handleToggle}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* QR Code Panel */}
        <div className="lg:col-span-1 h-[500px] md:sticky top-20">
          <QRCodePanel
            roomId={room.id}
            isLoading={isLoadingTakeAttendanceUrl}
            isOpen={isOpen}
            qrCode={takeAttendanceUrl?.qrCode}
            exp={takeAttendanceUrl?.exp}
          />
        </div>
        {/* Info Panel */}
        <div className="lg:col-span-2 order-2">
          <Card className="bg-white rounded-lg  p-8 h-full shadow-none">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {room.alias}
                </h1>
                <p className="text-sm text-gray-500">Room ID: {room.id}</p>
              </div>
              <div className="hidden md:block">
                <RoomActions
                  roomId={room.id}
                  roomAlias={room.alias}
                  isOpen={isOpen}
                  isLoading={isLoading}
                  isDisabled={isLoading}
                  handleToggle={handleToggle}
                />
              </div>
            </div>

            {/* Stats Cards */}
            {isLoadingAttendanceRecord ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-[38px] flex items-center"
              >
                <Spinner className="w-6 h-6 text-blue-600" />
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 order-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-blue-50 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm text-blue-600 font-medium"
                      >
                        Today's Attendance
                      </motion.p>
                      <p
                        key={"attendance-record-count"}
                        className="text-4xl font-bold text-blue-700"
                      >
                        {attendanceRecord?.count?.toString()}
                      </p>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, rotate: -20 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-blue-500"
                    >
                      <svg
                        className="w-12 h-12"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </motion.div>
                  </div>
                </motion.div>
                {/* divider */}
                <div className="h-[1px] bg-gray-200 w-full col-span-2" />
                {/* attendance record list */}
                <AttendanceRecordList
                  className="col-span-2"
                  records={attendanceRecord?.data || []}
                />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
