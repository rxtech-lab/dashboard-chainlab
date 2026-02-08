"use server";

import { isAuthenticated } from "@/lib/auth";
import { db } from "@/lib/database";
import { attendant, studentClass, classTable, semester } from "@/lib/schema";
import { handleDbError } from "@/lib/db.error";
import { cookies } from "next/headers";
import { eq, and, desc, count, inArray } from "drizzle-orm";

type ActionResponse = {
  success: boolean;
  error?: string;
};

export async function getStudents(
  page: number,
  limit: number,
  filters?: { semesterId?: number; classId?: number },
) {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) throw new Error(error);
    if (!session) throw new Error("Unauthorized");

    const offset = (page - 1) * limit;

    // If filtering by semester or class, get matching attendant IDs first
    let filteredAttendantIds: number[] | undefined;

    if (filters?.classId) {
      const matches = await db
        .select({ attendantId: studentClass.attendantId })
        .from(studentClass)
        .where(eq(studentClass.classId, filters.classId));
      filteredAttendantIds = matches.map((m) => m.attendantId);
    } else if (filters?.semesterId) {
      const matches = await db
        .select({ attendantId: studentClass.attendantId })
        .from(studentClass)
        .innerJoin(classTable, eq(studentClass.classId, classTable.id))
        .where(eq(classTable.semesterId, filters.semesterId));
      filteredAttendantIds = matches.map((m) => m.attendantId);
    }

    // If filter returned no IDs, return empty
    if (
      filteredAttendantIds !== undefined &&
      filteredAttendantIds.length === 0
    ) {
      return { data: [], totalPages: 0 };
    }

    const conditions = [eq(attendant.admin, session.id)];
    if (filteredAttendantIds !== undefined) {
      conditions.push(inArray(attendant.id, filteredAttendantIds));
    }

    const whereClause = and(...conditions);

    const [students, totalCountResult] = await Promise.all([
      db.query.attendant.findMany({
        where: whereClause,
        with: {
          studentClasses: {
            with: {
              classItem: {
                with: { semester: true },
              },
            },
          },
        },
        orderBy: [desc(attendant.createdAt), desc(attendant.id)],
        offset,
        limit,
      }),
      db.select({ count: count() }).from(attendant).where(whereClause),
    ]);

    const totalCount = totalCountResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalCount / limit);

    return { data: students, totalPages };
  } catch (error) {
    throw new Error(handleDbError(error));
  }
}

export async function createStudent(data: {
  firstName: string;
  lastName: string;
  uid: string;
  email?: string;
  walletAddress?: string;
  classIds?: number[];
}): Promise<ActionResponse> {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) return { success: false, error };
    if (!session) return { success: false, error: "Unauthorized" };

    // Create student
    const [newStudent] = await db
      .insert(attendant)
      .values({
        firstName: data.firstName,
        lastName: data.lastName,
        uid: data.uid,
        email: data.email,
        walletAddress: data.walletAddress,
        admin: session.id,
      })
      .returning();

    // Assign to classes if provided
    if (data.classIds && data.classIds.length > 0) {
      await db.insert(studentClass).values(
        data.classIds.map((classId) => ({
          attendantId: newStudent.id,
          classId: classId,
        })),
      );
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: handleDbError(error) };
  }
}

export async function updateStudent(
  id: number,
  data: {
    firstName?: string;
    lastName?: string;
    uid?: string;
    email?: string;
    walletAddress?: string;
    classIds?: number[];
  },
): Promise<ActionResponse> {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) return { success: false, error };
    if (!session) return { success: false, error: "Unauthorized" };

    const result = await db
      .update(attendant)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        uid: data.uid,
        email: data.email,
        walletAddress: data.walletAddress,
      })
      .where(and(eq(attendant.id, id), eq(attendant.admin, session.id)));

    if (result.rowsAffected === 0) {
      return { success: false, error: "Student not found or unauthorized" };
    }

    // Update class assignments if provided
    if (data.classIds !== undefined) {
      await db.delete(studentClass).where(eq(studentClass.attendantId, id));

      if (data.classIds.length > 0) {
        await db.insert(studentClass).values(
          data.classIds.map((classId) => ({
            attendantId: id,
            classId,
          })),
        );
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: handleDbError(error) };
  }
}

export async function deleteStudent(id: number): Promise<ActionResponse> {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) return { success: false, error };
    if (!session) return { success: false, error: "Unauthorized" };

    const result = await db
      .delete(attendant)
      .where(and(eq(attendant.id, id), eq(attendant.admin, session.id)));

    if (result.rowsAffected === 0) {
      return { success: false, error: "Student not found or unauthorized" };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: handleDbError(error) };
  }
}

export async function assignStudentToClasses(
  studentId: number,
  classIds: number[],
): Promise<ActionResponse> {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) return { success: false, error };
    if (!session) return { success: false, error: "Unauthorized" };

    // Verify the student belongs to this admin
    const found = await db.query.attendant.findFirst({
      where: and(eq(attendant.id, studentId), eq(attendant.admin, session.id)),
    });
    if (!found) return { success: false, error: "Student not found" };

    // Delete existing assignments
    await db
      .delete(studentClass)
      .where(eq(studentClass.attendantId, studentId));

    // Insert new assignments
    if (classIds.length > 0) {
      await db.insert(studentClass).values(
        classIds.map((classId) => ({
          attendantId: studentId,
          classId,
        })),
      );
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: handleDbError(error) };
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

type ImportResult = {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string; data?: Record<string, unknown> }>;
};

export async function importStudentsFromCSV(
  csvContent: string,
  classId?: number,
): Promise<ImportResult> {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) throw new Error(error);
    if (!session) throw new Error("Unauthorized");

    // Dynamically import papaparse
    const Papa = (await import("papaparse")).default;

    // Parse CSV
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim().toLowerCase(),
    });

    if (parseResult.errors.length > 0) {
      return {
        success: false,
        imported: 0,
        failed: 0,
        errors: parseResult.errors.map((err) => ({
          row: err.row || 0,
          error: err.message,
        })),
      };
    }

    const results: ImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      errors: [],
    };

    // Process each row
    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i] as Record<string, unknown>;
      const rowNum = i + 2; // +2 because CSV rows start at 1 and header is row 1

      try {
        // Validate required fields
        const firstName = (row.firstname || row["first name"] || row.first) as
          | string
          | undefined;
        const lastName = (row.lastname || row["last name"] || row.last) as
          | string
          | undefined;
        const uid = (row.uid ||
          row.studentid ||
          row["student id"] ||
          row.id) as string | undefined;

        const missingFields: string[] = [];
        if (!firstName) missingFields.push("firstname");
        if (!lastName) missingFields.push("lastname");
        if (!uid) missingFields.push("uid");

        if (missingFields.length > 0) {
          results.failed++;
          results.errors.push({
            row: rowNum,
            error: `Missing required field${missingFields.length > 1 ? "s" : ""}: ${missingFields.join(", ")}`,
            data: row,
          });
          continue;
        }

        // Optional fields
        const email = row.email as string | undefined;
        const walletAddress = (row.walletaddress || row["wallet address"]) as
          | string
          | undefined;

        // Check if student with this UID already exists
        const existing = await db.query.attendant.findFirst({
          where: and(
            eq(attendant.uid, String(uid)),
            eq(attendant.admin, session.id),
          ),
        });

        if (existing) {
          results.failed++;
          results.errors.push({
            row: rowNum,
            error: `Student with UID "${uid}" already exists`,
            data: row,
          });
          continue;
        }

        // Create student
        const [newStudent] = await db
          .insert(attendant)
          .values({
            firstName: String(firstName).trim(),
            lastName: String(lastName).trim(),
            uid: String(uid).trim(),
            email: email ? String(email).trim() : undefined,
            walletAddress: walletAddress
              ? String(walletAddress).trim()
              : undefined,
            admin: session.id,
          })
          .returning();

        // Assign to class if provided
        if (classId) {
          await db.insert(studentClass).values({
            attendantId: newStudent.id,
            classId: classId,
          });
        }

        results.imported++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          row: rowNum,
          error: err instanceof Error ? err.message : "Unknown error",
          data: row,
        });
      }
    }

    return results;
  } catch (error) {
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: [
        {
          row: 0,
          error:
            error instanceof Error ? error.message : "Failed to process CSV",
        },
      ],
    };
  }
}
