"use server";

import { Config } from "@/config/config";
import { getAttendanceNonceKey } from "@/lib/attendance.constants";
import { isAuthenticated } from "@/lib/auth";
import redis from "@/lib/redis";
import { db } from "@/lib/database";
import { attendanceRoom, attendanceRecord, attendant } from "@/lib/schema";
import { handleDbError } from "@/lib/db.error";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { eq, and, gte, desc, count } from "drizzle-orm";

export async function getAttendance(id: number) {
  try {
    const cookieStore = await cookies();
    const { error, session } = await isAuthenticated(cookieStore);

    if (error) {
      return { error: error };
    }

    const data = await db.query.attendanceRoom.findFirst({
      where: and(
        eq(attendanceRoom.id, id),
        eq(attendanceRoom.createdBy, session!.id)
      ),
    });

    if (!data) {
      return { error: "Attendance room not found" };
    }

    return { data };
  } catch (error) {
    return { error: handleDbError(error) };
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
    const todayStr = today.toISOString().replace("T", " ").slice(0, 19);

    const rawData = await db.query.attendanceRecord.findMany({
      where: and(
        eq(attendanceRecord.attendanceRoomId, id),
        gte(attendanceRecord.createdAt, todayStr)
      ),
      with: {
        attendanceRoom: true,
        attendant: true,
      },
      orderBy: desc(attendanceRecord.createdAt),
    });

    // Filter by session owner
    const filteredData = rawData.filter(
      (record) => record.attendanceRoom !== null
    );

    // Map the data to match AttendanceRecord interface
    const data = filteredData.map((record) => {
      const att = record.attendant as {
        firstName: string;
        lastName: string;
        uid: string;
      } | null;
      return {
        id: record.id,
        created_at: record.createdAt,
        attendant: att
          ? {
              first_name: att.firstName,
              last_name: att.lastName,
              uid: att.uid,
            }
          : null,
      };
    });

    const countResult = await db
      .select({ count: count() })
      .from(attendanceRecord)
      .where(
        and(
          eq(attendanceRecord.attendanceRoomId, id),
          gte(attendanceRecord.createdAt, todayStr)
        )
      );

    return { count: countResult[0]?.count ?? 0, data };
  } catch (error) {
    return { error: handleDbError(error) };
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
    return { error: handleDbError(error) };
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

    const data = await db.query.attendanceRoom.findFirst({
      where: and(
        eq(attendanceRoom.id, id),
        eq(attendanceRoom.createdBy, session!.id)
      ),
    });

    if (!data) {
      return { error: "Attendance room not found" };
    }

    if (data.isOpen === false) {
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
    return { error: handleDbError(error) };
  }
}
