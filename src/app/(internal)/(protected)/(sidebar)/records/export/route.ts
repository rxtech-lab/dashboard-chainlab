import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { isAuthenticated } from "@/lib/auth";
import { db } from "@/lib/database";
import {
  attendanceRecord,
  attendanceRoom,
  attendant,
  studentClass,
  classTable,
} from "@/lib/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const cookie = await cookies();
  const { error, session } = await isAuthenticated(cookie);
  if (error || !session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const semesterId = searchParams.get("semesterId");
  const classId = searchParams.get("classId");

  // Get room IDs for this admin, optionally filtered by semester
  const roomConditions = [eq(attendanceRoom.createdBy, session.id)];
  if (semesterId) {
    roomConditions.push(
      eq(attendanceRoom.semesterId, Number.parseInt(semesterId))
    );
  }

  const adminRooms = await db
    .select({ id: attendanceRoom.id })
    .from(attendanceRoom)
    .where(and(...roomConditions));

  const roomIds = adminRooms.map((r) => r.id);

  // Get filtered attendant IDs if class filter is applied
  let filteredAttendantIds: number[] | undefined;
  if (classId) {
    const matches = await db
      .select({ attendantId: studentClass.attendantId })
      .from(studentClass)
      .where(eq(studentClass.classId, Number.parseInt(classId)));
    filteredAttendantIds = matches.map((m) => m.attendantId);
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // CSV Header
      controller.enqueue(
        encoder.encode(
          "ID,Student Name,Student ID,Room,Semester,Classes,Date\n"
        )
      );

      if (roomIds.length === 0) {
        controller.close();
        return;
      }

      if (filteredAttendantIds !== undefined && filteredAttendantIds.length === 0) {
        controller.close();
        return;
      }

      const BATCH_SIZE = 100;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const conditions = [
          inArray(attendanceRecord.attendanceRoomId, roomIds),
        ];
        if (filteredAttendantIds) {
          conditions.push(
            inArray(attendanceRecord.attendantId, filteredAttendantIds)
          );
        }

        const records = await db.query.attendanceRecord.findMany({
          where: and(...conditions),
          with: {
            attendant: {
              with: {
                studentClasses: {
                  with: {
                    classItem: true,
                  },
                },
              },
            },
            attendanceRoom: {
              with: { semester: true },
            },
          },
          orderBy: [
            desc(attendanceRecord.createdAt),
            desc(attendanceRecord.id),
          ],
          limit: BATCH_SIZE,
          offset,
        });

        for (const record of records) {
          const att = record.attendant;
          const room = record.attendanceRoom;
          const classes = att?.studentClasses
            ?.filter((sc) => sc.classItem)
            .map((sc) => sc.classItem!.name)
            .join("; ") || "";

          const escapeCsv = (v: string) =>
            `"${String(v).replace(/"/g, '""')}"`;

          const line = [
            record.id,
            att ? `${att.firstName} ${att.lastName}` : "Unknown",
            att?.uid || "",
            room?.alias || "",
            room?.semester?.name || "",
            classes,
            record.createdAt,
          ]
            .map((v) => escapeCsv(String(v)))
            .join(",");

          controller.enqueue(encoder.encode(line + "\n"));
        }

        hasMore = records.length === BATCH_SIZE;
        offset += BATCH_SIZE;
      }

      controller.close();
    },
  });

  const date = new Date().toISOString().slice(0, 10);
  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendance-records-${date}.csv"`,
    },
  });
}
