"use server";

import { FormValues } from "@/components/pages/createRoom.type";
import { isAuthenticated } from "@/lib/auth";
import supabase from "@/lib/supabase";
import { cookies } from "next/headers";

/**
 * Creates a new attendance room.
 * @param roomId The alias of the room.
 * @returns The created room.
 */
export async function createAttendanceRoom(data: FormValues): Promise<{
  success: boolean;
  error?: string;
}> {
  const cookie = await cookies();
  const error = await isAuthenticated(cookie);
  if (error) {
    return {
      success: false,
      error: error.error,
    };
  }
  const { error: insertError } = await supabase()
    .from("attendance_room")
    .insert(data);

  if (insertError) {
    return {
      success: false,
      error: insertError.message,
    };
  }

  return {
    success: true,
  };
}

export async function getAttendanceRooms(page: number, limit: number) {
  const cookie = await cookies();
  const error = await isAuthenticated(cookie);
  if (error) {
    throw new Error(error.error);
  }

  const [roomsResponse, countResponse] = await Promise.all([
    supabase()
      .from("attendance_room")
      .select("*")
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1),
    supabase()
      .from("attendance_room")
      .select("*", { count: "exact", head: true }),
  ]);

  if (roomsResponse.error) {
    throw new Error(roomsResponse.error.message);
  }

  if (countResponse.error) {
    throw new Error(countResponse.error.message);
  }

  const totalPages = Math.ceil((countResponse.count || 0) / limit);

  return {
    data: roomsResponse.data,
    totalPages,
  };
}

/**
 * Updates the attendance room.
 * @param id The id of the attendance room.
 * @param data The data to update the attendance room.
 * @returns The updated attendance room.
 */
export async function updateAttendanceRoom(
  id: number,
  data: { is_open: boolean }
) {
  const cookie = await cookies();
  const error = await isAuthenticated(cookie);
  if (error) {
    return {
      success: false,
      error: error.error,
    };
  }
  const { error: updateError } = await supabase()
    .from("attendance_room")
    .update(data)
    .eq("id", id);

  if (updateError) {
    return {
      success: false,
      error: updateError.message,
    };
  }

  return {
    success: true,
  };
}

/**
 * Deletes the attendance room.
 * @param id The id of the attendance room.
 * @returns The deleted attendance room.
 */
export async function deleteAttendanceRoom(id: number) {
  const cookie = await cookies();
  const error = await isAuthenticated(cookie);
  if (error) {
    return {
      success: false,
      error: error.error,
    };
  }
  const { error: deleteError } = await supabase()
    .from("attendance_room")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return {
      success: false,
      error: deleteError.message,
    };
  }

  return {
    success: true,
  };
}

/**
 * Updates the attendance room name.
 * @param id The id of the attendance room.
 * @param data The data to update the attendance room.
 * @returns The updated attendance room.
 */
export async function updateAttendanceRoomName(
  id: number,
  data: { alias: string }
) {
  const cookie = await cookies();
  const error = await isAuthenticated(cookie);
  if (error) {
    return {
      success: false,
      error: error.error,
    };
  }
  const { error: updateError } = await supabase()
    .from("attendance_room")
    .update(data)
    .eq("id", id);

  if (updateError) {
    return {
      success: false,
      error: updateError.message,
    };
  }

  return {
    success: true,
  };
}
