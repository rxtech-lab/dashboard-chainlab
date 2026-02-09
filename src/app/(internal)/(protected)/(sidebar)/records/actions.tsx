"use server";

import { isAuthenticated } from "@/lib/auth";
import { db } from "@/lib/database";
import {
  attendanceRecord,
  attendanceRoom,
  attendant,
  studentClass,
  classTable,
  semester,
} from "@/lib/schema";
import { handleDbError } from "@/lib/db.error";
import { cookies } from "next/headers";
import { eq, and, desc, count, inArray } from "drizzle-orm";

export async function getAttendanceRecords(
  page: number,
  limit: number,
  filters?: { semesterId?: number; classId?: number }
) {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) throw new Error(error);
    if (!session) throw new Error("Unauthorized");

    const offset = (page - 1) * limit;

    // Get room IDs belonging to this admin, optionally filtered by semester
    const roomConditions = [eq(attendanceRoom.createdBy, session.id)];
    if (filters?.semesterId) {
      roomConditions.push(
        eq(attendanceRoom.semesterId, filters.semesterId)
      );
    }

    const adminRooms = await db
      .select({ id: attendanceRoom.id })
      .from(attendanceRoom)
      .where(and(...roomConditions));

    const roomIds = adminRooms.map((r) => r.id);
    if (roomIds.length === 0) {
      return { data: [], totalPages: 0 };
    }

    // If filtering by class, get attendant IDs in that class
    let filteredAttendantIds: number[] | undefined;
    if (filters?.classId) {
      const matches = await db
        .select({ attendantId: studentClass.attendantId })
        .from(studentClass)
        .where(eq(studentClass.classId, filters.classId));
      filteredAttendantIds = matches.map((m) => m.attendantId);
      if (filteredAttendantIds.length === 0) {
        return { data: [], totalPages: 0 };
      }
    }

    const conditions = [inArray(attendanceRecord.attendanceRoomId, roomIds)];
    if (filteredAttendantIds) {
      conditions.push(
        inArray(attendanceRecord.attendantId, filteredAttendantIds)
      );
    }

    const whereClause = and(...conditions);

    const [records, totalCountResult] = await Promise.all([
      db.query.attendanceRecord.findMany({
        where: whereClause,
        with: {
          attendant: {
            with: {
              studentClasses: {
                with: {
                  classItem: {
                    with: { semester: true },
                  },
                },
              },
            },
          },
          attendanceRoom: {
            with: { semester: true },
          },
        },
        orderBy: [desc(attendanceRecord.createdAt), desc(attendanceRecord.id)],
        offset,
        limit,
      }),
      db
        .select({ count: count() })
        .from(attendanceRecord)
        .where(whereClause),
    ]);

    const totalCount = totalCountResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalCount / limit);

    return { data: records, totalPages };
  } catch (error) {
    throw new Error(handleDbError(error));
  }
}

export async function getSemestersForFilter() {
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

export async function getClassesForFilter(semesterId: number) {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) throw new Error(error);
    if (!session) throw new Error("Unauthorized");

    const classes = await db.query.classTable.findMany({
      where: and(
        eq(classTable.semesterId, semesterId),
        eq(classTable.createdBy, session.id)
      ),
      columns: { id: true, name: true },
      orderBy: [desc(classTable.createdAt)],
    });

    return { data: classes };
  } catch (error) {
    throw new Error(handleDbError(error));
  }
}
