"use server";

import { getAttendantSignInMessage } from "@/config/config";
import { signInAsAttendant as signInAsAttendantLib } from "@/lib/attendance";
import { getAttendanceNonceKey } from "@/lib/attendance.constants";
import redis from "@/lib/redis";
import { prisma } from "@/lib/database";
import { handlePrismaError } from "@/lib/prisma.error";
import { verifyMessage } from "ethers";
import { cookies } from "next/headers";
import { SessionResponse } from "web3-connect-react";

interface SignInAsAttendantUser {
  firstName: string;
  lastName: string;
  userId: string;
  id: number;
}

export async function getAllAttendant(roomId: number) {
  try {
    const attendants = await prisma.attendant.findMany({
      where: {
        adminUser: {
          rooms: {
            some: {
              id: roomId,
            },
          },
        },
      },
      select: {
        id: true,
        uid: true,
        firstName: true,
        lastName: true,
        walletAddress: true,
      },
    });

    const data = attendants.map((attendant) => ({
      userId: attendant.uid,
      id: attendant.id,
      firstName: attendant.firstName,
      lastName: attendant.lastName,
      disabled: !!attendant.walletAddress,
    }));

    return { data };
  } catch (error) {
    return { error: handlePrismaError(error) };
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

    const query: any = {
      where: {
        walletAddress: walletAddress,
      },
      select: {
        id: true,
        uid: true,
        firstName: true,
        lastName: true,
        walletAddress: true,
      },
    };

    // If roomId is provided, only find attendants in that specific room
    if (roomId) {
      query.where.adminUser = {
        rooms: {
          some: {
            id: roomId,
          },
        },
      };
    }

    const data = await prisma.attendant.findFirst(query);

    if (data === null) {
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
    return { error: handlePrismaError(error) };
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

    const data = await prisma.attendanceRecord.findFirst({
      where: {
        attendantId,
        attendanceRoomId: roomId,
        createdAt: {
          gte: today,
        },
      },
    });

    return { data };
  } catch (error) {
    return { error: handlePrismaError(error) };
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

    const data = await prisma.attendant.findFirst({
      where: {
        walletAddress: walletAddress,
        // Only include attendants that belong to the specified room's admin
        adminUser: {
          rooms: {
            some: {
              id: roomId,
            },
          },
        },
      },
      select: {
        id: true,
        uid: true,
        firstName: true,
        lastName: true,
        walletAddress: true,
      },
    });

    if (data === null) {
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
    return { error: handlePrismaError(error) };
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
    const attendant = await prisma.attendant.findFirst({
      where: { id: user.id },
    });

    if (!attendant) {
      return { error: "Attendant not found" };
    }

    // If attendant has no wallet address, register it
    if (attendant.walletAddress === null) {
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

      const updatedAttendant = await prisma.attendant.update({
        where: {
          id: user.id,
          walletAddress: null,
        },
        data: {
          walletAddress: address,
        },
      });

      // Use the updated attendant's ID
      const userId = updatedAttendant.id;

      // Add the attendance record
      await prisma.attendanceRecord.create({
        data: {
          attendanceRoomId: roomId,
          attendantId: userId,
        },
      });

      return { error: null };
    }
    // If this attendant already has a wallet but it's different
    else if (attendant.walletAddress !== address) {
      return { error: "This user already has a registered wallet address" };
    }
    // If this attendant has this wallet address, just record attendance
    else {
      await prisma.attendanceRecord.create({
        data: {
          attendanceRoomId: roomId,
          attendantId: attendant.id,
        },
      });

      return { error: null };
    }
  } catch (error) {
    return { error: handlePrismaError(error) };
  }
}
