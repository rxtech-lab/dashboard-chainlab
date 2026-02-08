"use server";

import { isAuthenticated } from "@/lib/auth";
import { db } from "@/lib/database";
import { classTable, semester } from "@/lib/schema";
import { handleDbError } from "@/lib/db.error";
import { cookies } from "next/headers";
import { eq, and, desc, count } from "drizzle-orm";

type ActionResponse = {
  success: boolean;
  error?: string;
};

export async function getSemester(id: number) {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) throw new Error(error);
    if (!session) throw new Error("Unauthorized");

    const found = await db.query.semester.findFirst({
      where: and(eq(semester.id, id), eq(semester.createdBy, session.id)),
    });

    if (!found) throw new Error("Semester not found");
    return { data: found };
  } catch (error) {
    throw new Error(handleDbError(error));
  }
}

export async function getClasses(
  semesterId: number,
  page: number,
  limit: number
) {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) throw new Error(error);
    if (!session) throw new Error("Unauthorized");

    const offset = (page - 1) * limit;

    const [classes, totalCountResult] = await Promise.all([
      db.query.classTable.findMany({
        where: and(
          eq(classTable.semesterId, semesterId),
          eq(classTable.createdBy, session.id)
        ),
        orderBy: [desc(classTable.createdAt), desc(classTable.id)],
        offset,
        limit,
      }),
      db
        .select({ count: count() })
        .from(classTable)
        .where(
          and(
            eq(classTable.semesterId, semesterId),
            eq(classTable.createdBy, session.id)
          )
        ),
    ]);

    const totalCount = totalCountResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalCount / limit);

    return { data: classes, totalPages };
  } catch (error) {
    throw new Error(handleDbError(error));
  }
}

export async function getAllClasses(semesterId?: number) {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) throw new Error(error);
    if (!session) throw new Error("Unauthorized");

    const conditions = [eq(classTable.createdBy, session.id)];
    if (semesterId) {
      conditions.push(eq(classTable.semesterId, semesterId));
    }

    const classes = await db.query.classTable.findMany({
      where: and(...conditions),
      orderBy: [desc(classTable.createdAt)],
    });

    return { data: classes };
  } catch (error) {
    throw new Error(handleDbError(error));
  }
}

export async function createClass(data: {
  name: string;
  semesterId: number;
}): Promise<ActionResponse> {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) return { success: false, error };
    if (!session) return { success: false, error: "Unauthorized" };

    await db.insert(classTable).values({
      name: data.name,
      semesterId: data.semesterId,
      createdBy: session.id,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: handleDbError(error) };
  }
}

export async function updateClass(
  id: number,
  data: { name: string }
): Promise<ActionResponse> {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) return { success: false, error };
    if (!session) return { success: false, error: "Unauthorized" };

    const result = await db
      .update(classTable)
      .set({ name: data.name })
      .where(and(eq(classTable.id, id), eq(classTable.createdBy, session.id)));

    if (result.rowsAffected === 0) {
      return { success: false, error: "Class not found or unauthorized" };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: handleDbError(error) };
  }
}

export async function deleteClass(id: number): Promise<ActionResponse> {
  try {
    const cookie = await cookies();
    const { error, session } = await isAuthenticated(cookie);
    if (error) return { success: false, error };
    if (!session) return { success: false, error: "Unauthorized" };

    const result = await db
      .delete(classTable)
      .where(and(eq(classTable.id, id), eq(classTable.createdBy, session.id)));

    if (result.rowsAffected === 0) {
      return { success: false, error: "Class not found or unauthorized" };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: handleDbError(error) };
  }
}
