"use server";

import { FormValues } from "@/components/pages/createRoom.type";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/database";
import { handlePrismaError } from "@/lib/prisma.error";
import { cookies } from "next/headers";

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

    await prisma.attendanceRoom.create({
      data: {
        ...data,
        createdBy: session.id,
      },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handlePrismaError(error),
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

    const [rooms, totalCount] = await Promise.all([
      prisma.attendanceRoom.findMany({
        where: {
          createdBy: session.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.attendanceRoom.count({
        where: {
          createdBy: session.id,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: rooms,
      totalPages,
    };
  } catch (error) {
    throw new Error(handlePrismaError(error));
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

    const result = await prisma.attendanceRoom.updateMany({
      where: {
        id,
        createdBy: session.id,
      },
      data: {
        isOpen: data.isOpen,
      },
    });

    if (result.count === 0) {
      return { success: false, error: "Room not found or unauthorized" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handlePrismaError(error),
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

    const result = await prisma.attendanceRoom.deleteMany({
      where: {
        id,
        createdBy: session.id,
      },
    });

    if (result.count === 0) {
      return { success: false, error: "Room not found or unauthorized" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handlePrismaError(error),
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

    const result = await prisma.attendanceRoom.updateMany({
      where: {
        id,
        createdBy: session.id,
      },
      data: {
        alias: data.alias,
      },
    });

    if (result.count === 0) {
      return { success: false, error: "Room not found or unauthorized" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handlePrismaError(error),
    };
  }
}
