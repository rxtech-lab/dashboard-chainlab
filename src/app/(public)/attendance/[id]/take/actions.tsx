"use server";

import { getAttendantSignInMessage } from "@/config/config";
import { signInAsAttendant as signInAsAttendantLib } from "@/lib/attendance";
import { getAttendanceNonceKey } from "@/lib/attendance.constants";
import redis from "@/lib/redis";
import { db } from "@/lib/db";
import { attendant, attendanceRecord, attendanceRoom, user } from "@/lib/db/schema";
import { handleDatabaseError } from "@/lib/db/error";
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
    const attendants = await db
      .select({
        id: attendant.id,
        uid: attendant.uid,
        firstName: attendant.firstName,
        lastName: attendant.lastName,
        walletAddress: attendant.walletAddress,
      })
      .from(attendant)
      .innerJoin(user, eq(attendant.admin, user.id))
      .innerJoin(attendanceRoom, eq(attendanceRoom.createdBy, user.id))
      .where(eq(attendanceRoom.id, roomId));

    const data = attendants.map((att) => ({
      userId: att.uid,
      id: att.id,
      firstName: att.firstName,
      lastName: att.lastName,
      disabled: !!att.walletAddress,
    }));

    return { data };
  } catch (error) {
    return { error: handleDatabaseError(error) };
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

    let query;
    
    // If roomId is provided, only find attendants in that specific room
    if (roomId) {
      query = db
        .select({
          id: attendant.id,
          uid: attendant.uid,
          firstName: attendant.firstName,
          lastName: attendant.lastName,
          walletAddress: attendant.walletAddress,
        })
        .from(attendant)
        .innerJoin(user, eq(attendant.admin, user.id))
        .innerJoin(attendanceRoom, eq(attendanceRoom.createdBy, user.id))
        .where(
          and(
            eq(attendant.walletAddress, walletAddress),
            eq(attendanceRoom.id, roomId)
          )
        )
        .limit(1);
    } else {
      query = db
        .select({
          id: attendant.id,
          uid: attendant.uid,
          firstName: attendant.firstName,
          lastName: attendant.lastName,
          walletAddress: attendant.walletAddress,
        })
        .from(attendant)
        .where(eq(attendant.walletAddress, walletAddress))
        .limit(1);
    }

    const result = await query;
    const data = result[0];

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
    return { error: handleDatabaseError(error) };
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

    const result = await db
      .select()
      .from(attendanceRecord)
      .where(
        and(
          eq(attendanceRecord.attendantId, attendantId),
          eq(attendanceRecord.attendanceRoomId, roomId),
          gte(attendanceRecord.createdAt, today)
        )
      )
      .limit(1);

    return { data: result[0] };
  } catch (error) {
    return { error: handleDatabaseError(error) };
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

    const result = await db
      .select({
        id: attendant.id,
        uid: attendant.uid,
        firstName: attendant.firstName,
        lastName: attendant.lastName,
        walletAddress: attendant.walletAddress,
      })
      .from(attendant)
      .innerJoin(user, eq(attendant.admin, user.id))
      .innerJoin(attendanceRoom, eq(attendanceRoom.createdBy, user.id))
      .where(
        and(
          eq(attendant.walletAddress, walletAddress),
          eq(attendanceRoom.id, roomId)
        )
      )
      .limit(1);

    const data = result[0];

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
    return { error: handleDatabaseError(error) };
  }
}

export async function takeAttendance(
  user: SignInAsAttendantUser,
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

  const message = getAttendantSignInMessage(user, nonce as string);
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
    const attendantResult = await db
      .select()
      .from(attendant)
      .where(eq(attendant.id, user.id))
      .limit(1);

    const foundAttendant = attendantResult[0];

    if (!foundAttendant) {
      return { error: "Attendant not found" };
    }

    // If attendant has no wallet address, register it
    if (foundAttendant.walletAddress === null) {
      // If this wallet is already registered to someone else
      if (
        userWithWalletAddress.data?.address &&
        userWithWalletAddress.data.id !== user.id
      ) {
        return {
          error:
            "This wallet address is already registered to another attendant",
        };
      }

      const updatedAttendant = await db
        .update(attendant)
        .set({ walletAddress: address })
        .where(
          and(
            eq(attendant.id, user.id),
            eq(attendant.walletAddress, null)
          )
        )
        .returning();

      // Use the updated attendant's ID
      const userId = updatedAttendant[0].id;

      // Add the attendance record
      await db.insert(attendanceRecord).values({
        attendanceRoomId: roomId,
        attendantId: userId,
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
    return { error: handleDatabaseError(error) };
  }
}
