"use server";

import { Config } from "@/config/config";
import { getAttendanceNonceKey } from "@/lib/attendance";
import { isAuthenticated } from "@/lib/auth";
import redis from "@/lib/redis";
import supabase from "@/lib/supabase";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export async function getAttendance(id: number) {
  const cookieStore = await cookies();
  const { error, session } = await isAuthenticated(cookieStore);

  if (error) {
    return { error: error };
  }

  const { data, error: err } = await supabase()
    .from("attendance_room")
    .select("*")
    .eq("id", id)
    .eq("created_by", session!.id)
    .single();

  if (err) {
    return { error: err.message };
  }

  return { data: data };
}

export async function getAttendanceRecordByRoomId(id: number) {
  const cookieStore = await cookies();
  const { error, session } = await isAuthenticated(cookieStore);

  if (error) {
    return { error: error };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const {
    error: err,
    count,
    data,
  } = await supabase()
    .from("attendance_record")
    .select(
      `
      *,
      attendance_room:attendance_room_id (
        alias,
        created_at,
        is_open
      ),
      attendant:attendant_id (
        first_name,
        last_name,
        uid
      )
    `,
      { count: "exact" }
    )
    .eq("attendance_room_id", id)
    .eq("attendance_room.created_by", session!.id)
    .gte("created_at", today.toISOString())
    .order("created_at", { ascending: false });

  if (err) {
    return { error: err.message };
  }

  return { count, data };
}

/**
 * Generate a nonce and return a url and expiration time for the attendance room
 * @param id - The id of the attendance room
 * @returns - The url for the attendance room
 */
export async function generateAttendanceUrl(id: number) {
  const cookieStore = await cookies();
  const { error, session } = await isAuthenticated(cookieStore);

  if (error) {
    return { error: error };
  }

  const { data, error: err } = await supabase()
    .from("attendance_room")
    .select("*")
    .eq("id", id)
    .eq("created_by", session!.id)
    .single();

  if (err) {
    return { error: err.message };
  }

  if (data.is_open === false) {
    return { message: "Attendance room is not open" };
  }

  // generate nonce
  const nonce = uuidv4();

  // save nonce to redis

  const key = getAttendanceNonceKey(id);
  await redis.set(key, nonce, { ex: Config.Attendance.nonceExpiration });

  const currentTime = new Date();
  const expirationTime = new Date(
    currentTime.getTime() + Config.Attendance.nonceExpiration * 1000
  );

  return {
    url: `/attendance/${id}/take?nonce=${nonce}`,
    exp: expirationTime.toISOString(),
  };
}
