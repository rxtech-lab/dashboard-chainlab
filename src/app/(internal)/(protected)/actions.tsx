"use server";

import { FormValues } from "@/components/pages/createRoom.type";
import { isAuthenticated } from "@/lib/auth";
import { db } from "@/lib/database";
import { attendanceRoom, semester, classTable } from "@/lib/schema";
import { handleDbError } from "@/lib/db.error";
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
  data: FormValues,
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
      alias: data.alias,
      createdBy: session.id,
      semesterId: data.semesterId ?? null,
      classId: data.classId ?? null,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleDbError(error),
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

    const offset = (page - 1) * limit;

    const [rooms, totalCountResult] = await Promise.all([
      db.query.attendanceRoom.findMany({
        where: eq(attendanceRoom.createdBy, session.id),
        orderBy: [desc(attendanceRoom.createdAt), desc(attendanceRoom.id)],
        offset,
        limit,
        with: {
          semester: {
            columns: { id: true, name: true },
          },
          classItem: {
            columns: { id: true, name: true },
          },
        },
      }),
      db
        .select({ count: count() })
        .from(attendanceRoom)
        .where(eq(attendanceRoom.createdBy, session.id)),
    ]);

    const totalCount = totalCountResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: rooms,
      totalPages,
    };
  } catch (error) {
    throw new Error(handleDbError(error));
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
  data: { isOpen: boolean },
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
          eq(attendanceRoom.createdBy, session.id),
        ),
      );

    if (result.rowsAffected === 0) {
      return { success: false, error: "Room not found or unauthorized" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleDbError(error),
    };
  }
}

/**
 * Deletes the attendance room.
 * @param id The id of the attendance room.
 * @returns The deleted attendance room.
 */
export async function deleteAttendanceRoom(
  id: number,
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
          eq(attendanceRoom.createdBy, session.id),
        ),
      );

    if (result.rowsAffected === 0) {
      return { success: false, error: "Room not found or unauthorized" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleDbError(error),
    };
  }
}

/**
 * Updates the attendance room name.
 * @param id The id of the attendance room.
 * @param data The data to update the attendance room.
 * @returns The updated attendance room.
 */
export async function getAdminSemesters() {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) throw new Error(error);
    if (!session) throw new Error("Unauthorized");

    const semesters = await db.query.semester.findMany({
      where: eq(semester.createdBy, session.id),
      columns: { id: true, name: true },
      orderBy: [desc(semester.createdAt)],
    });

    return { data: semesters };
  } catch (error) {
    throw new Error(handleDbError(error));
  }
}

export async function getAdminClasses(semesterId: number) {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) throw new Error(error);
    if (!session) throw new Error("Unauthorized");

    const classes = await db.query.classTable.findMany({
      where: and(
        eq(classTable.semesterId, semesterId),
        eq(classTable.createdBy, session.id),
      ),
      columns: { id: true, name: true },
      orderBy: [desc(classTable.createdAt)],
    });

    return { data: classes };
  } catch (error) {
    throw new Error(handleDbError(error));
  }
}

export async function updateAttendanceRoomName(
  id: number,
  data: { alias: string; semesterId?: number; classId?: number },
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
      .set({
        alias: data.alias,
        semesterId: data.semesterId ?? null,
        classId: data.classId ?? null,
      })
      .where(
        and(
          eq(attendanceRoom.id, id),
          eq(attendanceRoom.createdBy, session.id),
        ),
      );

    if (result.rowsAffected === 0) {
      return { success: false, error: "Room not found or unauthorized" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleDbError(error),
    };
  }
}
