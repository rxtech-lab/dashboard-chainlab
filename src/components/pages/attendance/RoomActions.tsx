import { updateAttendanceRoom } from "@/app/(internal)/(protected)/actions";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useSWRConfig } from "swr";
import UpdateRoomDialog from "../UpdateRoomDialog";
import { useRouter } from "next/navigation";

interface RoomActionsProps {
  roomId: number;
  roomAlias: string;
  isOpen: boolean;
  handleToggle: () => void;
  isLoading: boolean;
  isDisabled: boolean;
}

export default function RoomActions({
  roomId,
  roomAlias,
  isOpen,
  handleToggle,
  isLoading,
}: RoomActionsProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Room Status:</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isOpen}
            onChange={handleToggle}
            disabled={isLoading}
          />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      <UpdateRoomDialog roomId={roomId} currentAlias={roomAlias} />
    </div>
  );
}
