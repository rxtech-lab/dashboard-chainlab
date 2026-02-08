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
  user,
} from "@/lib/schema";
import { handleDbError } from "@/lib/db.error";
import { verifyMessage } from "ethers";
import { cookies } from "next/headers";
import { SessionResponse } from "web3-connect-react";
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
          eq(attendant.walletAddress, walletAddress),
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
        where: eq(attendant.walletAddress, walletAddress),
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

    // Find the room to get the admin
    const room = await db.query.attendanceRoom.findFirst({
      where: eq(attendanceRoom.id, roomId),
    });

    if (!room) {
      return { data: undefined };
    }

    const data = await db.query.attendant.findFirst({
      where: and(
        eq(attendant.walletAddress, walletAddress),
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
  const nonceKey = getAttendanceNonceKey(roomId);
  const nonce = await redis.get(nonceKey);
  if (!nonce) {
    return {
      error: "Nonce not found",
    };
  }

  if (nonce !== previousNonce) {
    return {
      error: "Nonce mismatch",
    };
  }

  const message = getAttendantSignInMessage(userInfo, nonce as string);
  const messageAddress = verifyMessage(message, signature);
  if (messageAddress !== address) {
    return {
      error: "Invalid signature",
    };
  }

  try {
    // Check if the wallet is registered to ANY attendant
    const userWithWalletAddress = await getAttendantByWalletAddress(address);

    // Check if the wallet is registered to an attendant in THIS room
    const userInCurrentRoom = await getAttendantByWalletAddress(
      address,
      roomId
    );

    // Get the attendant we're trying to register
    const foundAttendant = await db.query.attendant.findFirst({
      where: eq(attendant.id, userInfo.id),
    });

    if (!foundAttendant) {
      return { error: "Attendant not found" };
    }

    // If attendant has no wallet address, register it
    if (foundAttendant.walletAddress === null) {
      // If this wallet is already registered to someone else
      if (
        userWithWalletAddress.data?.address &&
        userWithWalletAddress.data.id !== userInfo.id
      ) {
        return {
          error:
            "This wallet address is already registered to another attendant",
        };
      }

      await db
        .update(attendant)
        .set({ walletAddress: address })
        .where(eq(attendant.id, userInfo.id));

      // Add the attendance record
      await db.insert(attendanceRecord).values({
        attendanceRoomId: roomId,
        attendantId: userInfo.id,
      });

      return { error: null };
    }
    // If this attendant already has a wallet but it's different
    else if (foundAttendant.walletAddress !== address) {
      return { error: "This user already has a registered wallet address" };
    }
    // If this attendant has this wallet address, just record attendance
    else {
      await db.insert(attendanceRecord).values({
        attendanceRoomId: roomId,
        attendantId: foundAttendant.id,
      });

      return { error: null };
    }
  } catch (error) {
    return { error: handleDbError(error) };
  }
}
