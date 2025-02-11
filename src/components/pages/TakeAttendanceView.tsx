"use client";

import { useState } from "react";
import type { Database } from "@/lib/database.types";

type AttendanceRoom = Database["public"]["Tables"]["attendance_room"]["Row"];

interface TakeAttendanceViewProps {
  room: AttendanceRoom;
}

export default function TakeAttendanceView({ room }: TakeAttendanceViewProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{room.alias}</h1>
        <p className="text-gray-600 mb-8">
          Please connect your wallet to take attendance
        </p>
        {/* Add your wallet connection and attendance taking logic here */}
      </div>
    </div>
  );
} 