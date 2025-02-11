"use server";

import { Config, getAttendantSignInMessage } from "@/config/config";
import { ATTENDANT_COOKIE_NAME, getAttendanceNonceKey } from "@/lib/attendance";
import redis from "@/lib/redis";
import supabase from "@/lib/supabase";
import { verifyMessage } from "ethers";
import { cookies } from "next/headers";

interface SignInAsAttendantUser {
  firstName: string;
  lastName: string;
  userId: string;
}

export async function getAllAttendant(roomId: number): Promise<{
  data?: {
    id: number;
    firstName: string;
    lastName: string;
    disabled: boolean;
  }[];
  error?: string;
}> {
  const { data: attendants, error } = await supabase()
    .from("attendance_record")
    .select(
      `
        attendant:attendant_id(
          id,
          first_name,
          last_name,
          wallet_address
        )
      `
    )
    .eq("attendance_room_id", roomId);

  if (error) {
    return {
      error: error.message,
    };
  }

  if (!attendants) {
    return {
      data: [],
    };
  }
  const data = attendants.map(({ attendant }: any) => ({
    id: attendant.id,
    firstName: attendant.first_name,
    lastName: attendant.last_name,
    disabled: !!attendant.wallet_address, // true if wallet exists
  }));
  return {
    data,
  };
}

export async function signInAsAttendant(
  user: SignInAsAttendantUser,
  roomId: number,
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
  const message = getAttendantSignInMessage(user, nonce as string);
  const messageAddress = verifyMessage(message, signature);
  if (messageAddress !== address) {
    return {
      error: "Invalid signature",
    };
  }

  // set cookie
  const cookieStore = await cookies();
  cookieStore.set(ATTENDANT_COOKIE_NAME, address, {
    httpOnly: true,
    secure: true,
    maxAge: Config.Attendance.cookieExpiration,
  });

  return {
    error: null,
  };
}
