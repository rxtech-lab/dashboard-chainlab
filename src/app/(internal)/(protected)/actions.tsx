"use server";

import { FormValues } from "@/components/pages/createRoom.type";
import { isAuthenticated } from "@/lib/auth";
import { db } from "@/lib/db";
import { attendanceRoom } from "@/lib/db/schema";
import { handleDatabaseError } from "@/lib/db/error";
import { cookies } from "next/headers";
import { eq, and, desc, count } from "drizzle-orm";

// Custom error type for better error handling
type ActionResponse = {
  success: boolean;
  error?: string;
};

/**
 * Creates a new attendance room.
 * @param roomId The alias of the room.
 * @returns The created room.
 */
export async function createAttendanceRoom(
  data: FormValues
): Promise<ActionResponse> {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) {
      return { success: false, error };
    }
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    await db.insert(attendanceRoom).values({
      ...data,
      createdBy: session.id,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    };
  }
}

export async function getAttendanceRooms(page: number, limit: number) {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) {
      throw new Error(error);
    }
    if (!session) {
      throw new Error("Unauthorized");
    }

    const skip = (page - 1) * limit;

    const rooms = await db
      .select()
      .from(attendanceRoom)
      .where(eq(attendanceRoom.createdBy, session.id))
      .orderBy(desc(attendanceRoom.createdAt))
      .offset(skip)
      .limit(limit);

    const countResult = await db
      .select({ count: count() })
      .from(attendanceRoom)
      .where(eq(attendanceRoom.createdBy, session.id));

    const totalCount = countResult[0].count;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: rooms,
      totalPages,
    };
  } catch (error) {
    throw new Error(handleDatabaseError(error));
  }
}

/**
 * Updates the attendance room.
 * @param id The id of the attendance room.
 * @param data The data to update the attendance room.
 * @returns The updated attendance room.
 */
export async function updateAttendanceRoom(
  id: number,
  data: { isOpen: boolean }
): Promise<ActionResponse> {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) {
      return { success: false, error };
    }
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await db
      .update(attendanceRoom)
      .set({ isOpen: data.isOpen })
      .where(
        and(
          eq(attendanceRoom.id, id),
          eq(attendanceRoom.createdBy, session.id)
        )
      )
      .returning({ id: attendanceRoom.id });

    if (result.length === 0) {
      return { success: false, error: "Room not found or unauthorized" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    };
  }
}

/**
 * Deletes the attendance room.
 * @param id The id of the attendance room.
 * @returns The deleted attendance room.
 */
export async function deleteAttendanceRoom(
  id: number
): Promise<ActionResponse> {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) {
      return { success: false, error };
    }
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await db
      .delete(attendanceRoom)
      .where(
        and(
          eq(attendanceRoom.id, id),
          eq(attendanceRoom.createdBy, session.id)
        )
      )
      .returning({ id: attendanceRoom.id });

    if (result.length === 0) {
      return { success: false, error: "Room not found or unauthorized" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    };
  }
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
): Promise<ActionResponse> {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) {
      return { success: false, error };
    }
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await db
      .update(attendanceRoom)
      .set({ alias: data.alias })
      .where(
        and(
          eq(attendanceRoom.id, id),
          eq(attendanceRoom.createdBy, session.id)
        )
      )
      .returning({ id: attendanceRoom.id });

    if (result.length === 0) {
      return { success: false, error: "Room not found or unauthorized" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleDatabaseError(error),
    };
  }
}
