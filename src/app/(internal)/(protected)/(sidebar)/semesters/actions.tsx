"use server";

import { isAuthenticated } from "@/lib/auth";
import { db } from "@/lib/database";
import { semester } from "@/lib/schema";
import { handleDbError } from "@/lib/db.error";
import { cookies } from "next/headers";
import { eq, and, desc, count } from "drizzle-orm";

type ActionResponse = {
  success: boolean;
  error?: string;
};

export async function getSemesters(page: number, limit: number) {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) throw new Error(error);
    if (!session) throw new Error("Unauthorized");

    const offset = (page - 1) * limit;

    const [semesters, totalCountResult] = await Promise.all([
      db.query.semester.findMany({
        where: eq(semester.createdBy, session.id),
        orderBy: [desc(semester.createdAt), desc(semester.id)],
        offset,
        limit,
      }),
      db
        .select({ count: count() })
        .from(semester)
        .where(eq(semester.createdBy, session.id)),
    ]);

    const totalCount = totalCountResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalCount / limit);

    return { data: semesters, totalPages };
  } catch (error) {
    throw new Error(handleDbError(error));
  }
}

export async function getAllSemesters() {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) throw new Error(error);
    if (!session) throw new Error("Unauthorized");

    const semesters = await db.query.semester.findMany({
      where: eq(semester.createdBy, session.id),
      orderBy: [desc(semester.createdAt)],
    });

    return { data: semesters };
  } catch (error) {
    throw new Error(handleDbError(error));
  }
}

export async function createSemester(data: {
  name: string;
}): Promise<ActionResponse> {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) return { success: false, error };
    if (!session) return { success: false, error: "Unauthorized" };

    await db.insert(semester).values({
      name: data.name,
      createdBy: session.id,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: handleDbError(error) };
  }
}

export async function updateSemester(
  id: number,
  data: { name?: string; isActive?: boolean }
): Promise<ActionResponse> {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) return { success: false, error };
    if (!session) return { success: false, error: "Unauthorized" };

    const result = await db
      .update(semester)
      .set(data)
      .where(and(eq(semester.id, id), eq(semester.createdBy, session.id)));

    if (result.rowsAffected === 0) {
      return { success: false, error: "Semester not found or unauthorized" };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: handleDbError(error) };
  }
}

export async function deleteSemester(id: number): Promise<ActionResponse> {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) return { success: false, error };
    if (!session) return { success: false, error: "Unauthorized" };

    const result = await db
      .delete(semester)
      .where(and(eq(semester.id, id), eq(semester.createdBy, session.id)));

    if (result.rowsAffected === 0) {
      return { success: false, error: "Semester not found or unauthorized" };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: handleDbError(error) };
  }
}
