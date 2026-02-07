"use server";

import { Config } from "@/config/config";
import { getAttendanceNonceKey } from "@/lib/attendance.constants";
import { isAuthenticated } from "@/lib/auth";
import redis from "@/lib/redis";
import { db } from "@/lib/db";
import { attendanceRoom, attendanceRecord, attendant } from "@/lib/db/schema";
import { handleDatabaseError } from "@/lib/db/error";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { eq, and, gte, desc } from "drizzle-orm";

export async function getAttendance(id: number) {
  try {
    const cookieStore = await cookies();
    const { error, session } = await isAuthenticated(cookieStore);

    if (error) {
      return { error: error };
    }

    const data = await db
      .select()
      .from(attendanceRoom)
      .where(
        and(
          eq(attendanceRoom.id, id),
          eq(attendanceRoom.createdBy, session!.id)
        )
      )
      .limit(1);

    if (!data || data.length === 0) {
      return { error: "Attendance room not found" };
    }

    return { data: data[0] };
  } catch (error) {
    return { error: handleDatabaseError(error) };
  }
}

export async function getAttendanceRecordByRoomId(id: number) {
  try {
    const cookieStore = await cookies();
    const { error, session } = await isAuthenticated(cookieStore);

    if (error) {
      return { error: error };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rawData = await db
      .select({
        id: attendanceRecord.id,
        createdAt: attendanceRecord.createdAt,
        attendant: {
          firstName: attendant.firstName,
          lastName: attendant.lastName,
          uid: attendant.uid,
        },
      })
      .from(attendanceRecord)
      .innerJoin(
        attendanceRoom,
        eq(attendanceRecord.attendanceRoomId, attendanceRoom.id)
      )
      .innerJoin(attendant, eq(attendanceRecord.attendantId, attendant.id))
      .where(
        and(
          eq(attendanceRecord.attendanceRoomId, id),
          eq(attendanceRoom.createdBy, session!.id),
          gte(attendanceRecord.createdAt, today)
        )
      )
      .orderBy(desc(attendanceRecord.createdAt));

    // Map the data to match AttendanceRecord interface
    const data = rawData.map((record) => ({
      id: record.id,
      created_at: record.createdAt.toISOString(),
      attendant: record.attendant
        ? {
            first_name: record.attendant.firstName,
            last_name: record.attendant.lastName,
            uid: record.attendant.uid,
          }
        : null,
    }));

    const count = data.length;

    return { count, data };
  } catch (error) {
    return { error: handleDatabaseError(error) };
  }
}

export async function refreshNonce(id: number) {
  try {
    const cookieStore = await cookies();
    const { error } = await isAuthenticated(cookieStore);

    if (error) {
      return { error: error };
    }

    const key = getAttendanceNonceKey(id);
    const nonce = uuidv4();
    const expirationTime = new Date(
      Date.now() + Config.Attendance.nonceExpiration * 1000
    );

    await redis.set(key, nonce, {
      ex: Config.Attendance.nonceExpiration,
    });

    return {
      url: `/attendance/${id}/take?nonce=${nonce}`,
      exp: expirationTime.toISOString(),
    };
  } catch (error) {
    return { error: handleDatabaseError(error) };
  }
}

/**
 * Generate a nonce and return a url and expiration time for the attendance room
 * @param id - The id of the attendance room
 * @returns - The url for the attendance room
 */
export async function generateAttendanceUrl(id: number) {
  try {
    const cookieStore = await cookies();
    const { error, session } = await isAuthenticated(cookieStore);

    if (error) {
      return { error: error };
    }

    // check if the nonce is already set
    const key = getAttendanceNonceKey(id);
    let nonce = await redis.get(key);
    if (nonce) {
      const remainingTime = await redis.ttl(key);
      const expirationTime = new Date(Date.now() + remainingTime * 1000);
      return {
        url: `/attendance/${id}/take?nonce=${nonce}`,
        exp: expirationTime.toISOString(),
      };
    }

    const data = await db
      .select()
      .from(attendanceRoom)
      .where(
        and(
          eq(attendanceRoom.id, id),
          eq(attendanceRoom.createdBy, session!.id)
        )
      )
      .limit(1);

    if (!data || data.length === 0) {
      return { error: "Attendance room not found" };
    }

    if (data[0].isOpen === false) {
      return { message: "Attendance room is not open" };
    }

    // generate nonce
    nonce = uuidv4();

    // save nonce to redis
    await redis.set(key, nonce, { ex: Config.Attendance.nonceExpiration });

    const currentTime = new Date();
    const expirationTime = new Date(
      currentTime.getTime() + Config.Attendance.nonceExpiration * 1000
    );

    return {
      url: `/attendance/${id}/take?nonce=${nonce}`,
      exp: expirationTime.toISOString(),
    };
  } catch (error) {
    return { error: handleDatabaseError(error) };
  }
}
