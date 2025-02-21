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

export async function getAttendantByWalletAddress(walletAddress?: string) {
  try {
    if (!walletAddress) {
      return { data: undefined };
    }

    const data = await prisma.attendant.findFirst({
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
    const userWithWalletAddress = await getAttendantByWalletAddress(address);
    if (userWithWalletAddress.error) {
      return { error: userWithWalletAddress.error };
    }
    let userId = userWithWalletAddress.data?.id;

    const attendant = await prisma.attendant.findFirst({
      where: { id: user.id },
    });

    if (!attendant) {
      return { error: "Attendant not found" };
    }

    // If attendant has no wallet address, register it
    if (attendant.walletAddress === null) {
      if (userWithWalletAddress.data?.address) {
        return { error: "You have already registered a wallet address" };
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

      userId = updatedAttendant.id;
    } else if (attendant.walletAddress !== address) {
      return { error: "This user already has a registered wallet address" };
    }

    if (!userId) {
      return { error: "User ID not found" };
    }

    // Add the attendance record
    await prisma.attendanceRecord.create({
      data: {
        attendanceRoomId: roomId,
        attendantId: userId,
      },
    });

    return { error: null };
  } catch (error) {
    return { error: handlePrismaError(error) };
  }
}
