"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import type { Database } from "@/lib/database.types";
import Spinner from "../ui/spinner";
import {
  deleteAttendanceRoom,
  updateAttendanceRoom,
} from "@/app/(protected)/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import UpdateRoomDialog from "./UpdateRoomDialog";

type AttendanceRoom = Database["public"]["Tables"]["attendance_room"]["Row"];

export function AttendanceRoomList({ rooms }: { rooms: AttendanceRoom[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AnimatePresence mode="popLayout">
        {rooms.map((room) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            layout
            layoutId={room.id.toString()}
            transition={{
              duration: 0.2,
              layout: {
                duration: 0.2,
              },
            }}
          >
            <AttendanceRoomCard room={room} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface AttendanceRoomCardProps {
  room: AttendanceRoom;
}

function AttendanceRoomCard({ room }: AttendanceRoomCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const handleToggle = async () => {
    setIsLoading(true);
    const { error } = await updateAttendanceRoom(room.id, {
      is_open: !room.is_open,
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
      toast.toast({
        title: "Success",
        description: "Attendance room updated successfully",
      });
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm(
      "Are you sure you want to delete this attendance room?"
    );
    if (!confirm) return;
    setIsLoading(true);
    const { error } = await deleteAttendanceRoom(room.id).finally(() => {
      setIsLoading(false);
    });
    if (error) {
      toast.toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast.toast({
        title: "Success",
        description: "Attendance room deleted successfully",
      });
      router.refresh();
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 relative 
        transition-all duration-200 hover:shadow-lg hover:border-gray-300
        ${isLoading ? "pointer-events-none" : ""}`}
    >
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg z-10"
        >
          <Spinner />
        </motion.div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={room.alias}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {room.alias}
              </h3>
              <p className="text-sm text-gray-500 mt-1">Room ID: {room.id}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              defaultChecked={room.is_open}
              onChange={handleToggle}
            />
            <div
              className="w-11 h-6 bg-gray-200 rounded-full peer 
                peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                peer-checked:after:border-white after:content-[''] after:absolute 
                after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 
                after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                peer-checked:bg-blue-600"
            ></div>
          </label>
          <UpdateRoomDialog roomId={room.id} currentAlias={room.alias} />
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-600 transition-colors duration-200"
            disabled={isLoading}
            aria-label="Delete room"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <p>Created: {new Date(room.created_at).toLocaleDateString()}</p>
        </div>
        <button
          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
          onClick={() => setIsLoading(true)}
        >
          View Details →
        </button>
      </div>
    </div>
  );
}
