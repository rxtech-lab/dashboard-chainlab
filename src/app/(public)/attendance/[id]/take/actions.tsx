"use server";

import { getAttendantSignInMessage } from "@/config/config";
import { signInAsAttendant as signInAsAttendantLib } from "@/lib/attendance";
import { getAttendanceNonceKey } from "@/lib/attendance.constants";
import redis from "@/lib/redis";
import { db } from "@/lib/database";
import {
  attendant,
  attendanceRecord,
  attendanceRoom,
} from "@/lib/schema";
import { handleDbError } from "@/lib/db.error";
import { verifyMessage } from "ethers";
import { cookies } from "next/headers";
import type { SessionResponse } from "web3-connect-react";
import { eq, and, gte } from "drizzle-orm";

interface SignInAsAttendantUser {
  firstName: string;
  lastName: string;
  userId: string;
  id: number;
}

export async function getAllAttendant(roomId: number) {
  try {
    // Find the room to get the creator (admin)
    const room = await db.query.attendanceRoom.findFirst({
      where: eq(attendanceRoom.id, roomId),
    });

    if (!room) {
      return { data: [] };
    }

    const attendants = await db.query.attendant.findMany({
      where: eq(attendant.admin, room.createdBy),
      columns: {
        id: true,
        uid: true,
        firstName: true,
        lastName: true,
        walletAddress: true,
      },
    });

    const data = attendants.map((a) => ({
      userId: a.uid,
      id: a.id,
      firstName: a.firstName,
      lastName: a.lastName,
      disabled: !!a.walletAddress,
    }));

    return { data };
  } catch (error) {
    return { error: handleDbError(error) };
  }
}

export async function getAttendantByWalletAddress(
  walletAddress?: string,
  roomId?: number
) {
  try {
    if (!walletAddress) {
      return { data: undefined };
    }

    const normalizedAddress = walletAddress.toLowerCase();

    let data;
    if (roomId) {
      // Find the room to get the admin
      const room = await db.query.attendanceRoom.findFirst({
        where: eq(attendanceRoom.id, roomId),
      });

      if (!room) {
        return { data: undefined };
      }

      data = await db.query.attendant.findFirst({
        where: and(
          eq(attendant.walletAddress, normalizedAddress),
          eq(attendant.admin, room.createdBy)
        ),
        columns: {
          id: true,
          uid: true,
          firstName: true,
          lastName: true,
          walletAddress: true,
        },
      });
    } else {
      data = await db.query.attendant.findFirst({
        where: eq(attendant.walletAddress, normalizedAddress),
        columns: {
          id: true,
          uid: true,
          firstName: true,
          lastName: true,
          walletAddress: true,
        },
      });
    }

    if (!data) {
      return { data: undefined };
    }

    return {
      data: {
        id: data.id,
        userId: data.uid,
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        address: data.walletAddress,
      },
    };
  } catch (error) {
    return { error: handleDbError(error) };
  }
}

export async function hasAttendantTakenAttendanceForToday(
  attendantId: number,
  roomId: number
) {
  if (!attendantId || !roomId) {
    return { data: undefined };
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().replace("T", " ").slice(0, 19);

    const data = await db.query.attendanceRecord.findFirst({
      where: and(
        eq(attendanceRecord.attendantId, attendantId),
        eq(attendanceRecord.attendanceRoomId, roomId),
        gte(attendanceRecord.createdAt, todayStr)
      ),
    });

    return { data };
  } catch (error) {
    return { error: handleDbError(error) };
  }
}

export async function signInAsAttendant(session: SessionResponse) {
  const cookieStore = await cookies();
  return signInAsAttendantLib(cookieStore, session);
}

/**
 * Gets an attendant by wallet address only if they belong to the specified room
 * @param walletAddress The wallet address to look up
 * @param roomId The room ID to check against
 * @returns The attendant data if found in the room, undefined otherwise
 */
export async function getAttendantByWalletAddressForRoom(
  walletAddress?: string,
  roomId?: number
) {
  try {
    if (!walletAddress || !roomId) {
      return { data: undefined };
    }

    const normalizedAddress = walletAddress.toLowerCase();

    // Find the room to get the admin
    const room = await db.query.attendanceRoom.findFirst({
      where: eq(attendanceRoom.id, roomId),
    });

    if (!room) {
      return { data: undefined };
    }

    const data = await db.query.attendant.findFirst({
      where: and(
        eq(attendant.walletAddress, normalizedAddress),
        eq(attendant.admin, room.createdBy)
      ),
      columns: {
        id: true,
        uid: true,
        firstName: true,
        lastName: true,
        walletAddress: true,
      },
    });

    if (!data) {
      return { data: undefined };
    }

    return {
      data: {
        id: data.id,
        userId: data.uid,
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        address: data.walletAddress,
      },
    };
  } catch (error) {
    return { error: handleDbError(error) };
  }
}

export async function takeAttendance(
  userInfo: SignInAsAttendantUser,
  roomId: number,
  previousNonce: string,
  signature: string,
  address: string
) {
  // Normalize Ethereum address to lowercase for case-insensitive comparison
  const normalizedAddress = address.toLowerCase();

  const nonceKey = getAttendanceNonceKey(roomId);
  const nonce = await redis.get(nonceKey);
  if (!nonce) {
    console.log("[takeAttendance] Nonce not found in Redis", { roomId });
    return { error: "Nonce not found" };
  }

  if (nonce !== previousNonce) {
    console.log("[takeAttendance] Nonce mismatch", {
      roomId,
      expected: nonce,
      received: previousNonce,
    });
    return { error: "Nonce mismatch" };
  }

  const message = getAttendantSignInMessage(userInfo, nonce as string);
  const messageAddress = verifyMessage(message, signature).toLowerCase();
  if (messageAddress !== normalizedAddress) {
    console.log("[takeAttendance] Invalid signature", {
      messageAddress,
      normalizedAddress,
    });
    return { error: "Invalid signature" };
  }

  console.log("[takeAttendance] Nonce & signature validated", {
    roomId,
    address: normalizedAddress,
    userId: userInfo.userId,
  });

  try {
    // Check if the wallet is registered to ANY attendant
    const userWithWalletAddress =
      await getAttendantByWalletAddress(normalizedAddress);

    // Get the attendant we're trying to register
    const foundAttendant = await db.query.attendant.findFirst({
      where: eq(attendant.id, userInfo.id),
    });

    if (!foundAttendant) {
      console.log("[takeAttendance] Attendant not found", {
        id: userInfo.id,
      });
      return { error: "Attendant not found" };
    }

    console.log("[takeAttendance] Found attendant", {
      id: foundAttendant.id,
      storedWallet: foundAttendant.walletAddress,
      providedAddress: normalizedAddress,
    });

    // If attendant has no wallet address, register it
    if (foundAttendant.walletAddress === null) {
      // If this wallet is already registered to someone else
      if (
        userWithWalletAddress.data?.address &&
        userWithWalletAddress.data.id !== userInfo.id
      ) {
        console.log("[takeAttendance] Wallet conflict", {
          existingId: userWithWalletAddress.data.id,
          requestedId: userInfo.id,
        });
        return {
          error:
            "This wallet address is already registered to another attendant",
        };
      }

      await db
        .update(attendant)
        .set({ walletAddress: normalizedAddress })
        .where(eq(attendant.id, userInfo.id));

      // Add the attendance record
      const insertResult = await db
        .insert(attendanceRecord)
        .values({
          attendanceRoomId: roomId,
          attendantId: userInfo.id,
        })
        .returning({ id: attendanceRecord.id });

      console.log("[takeAttendance] New attendant registered", {
        attendantId: userInfo.id,
        roomId,
        insertedRecordId: insertResult[0]?.id,
      });

      if (!insertResult.length) {
        return { error: "Failed to save attendance record" };
      }

      return { error: null };
    }

    // If this attendant already has a wallet but it's different
    if (foundAttendant.walletAddress.toLowerCase() !== normalizedAddress) {
      console.log("[takeAttendance] Wallet mismatch", {
        stored: foundAttendant.walletAddress,
        provided: normalizedAddress,
      });
      return { error: "This user already has a registered wallet address" };
    }

    // If this attendant has this wallet address, just record attendance
    const insertResult = await db
      .insert(attendanceRecord)
      .values({
        attendanceRoomId: roomId,
        attendantId: foundAttendant.id,
      })
      .returning({ id: attendanceRecord.id });

    console.log("[takeAttendance] Returning attendant", {
      attendantId: foundAttendant.id,
      roomId,
      insertedRecordId: insertResult[0]?.id,
    });

    if (!insertResult.length) {
      return { error: "Failed to save attendance record" };
    }

    return { error: null };
  } catch (error) {
    console.error("[takeAttendance] DB error", { roomId, address: normalizedAddress }, error);
    return { error: handleDbError(error) };
  }
}
