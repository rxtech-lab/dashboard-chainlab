"use server";

import { Config, getAttendantSignInMessage } from "@/config/config";
import {
  ATTENDANT_COOKIE_NAME,
  getAttendanceNonceKey,
} from "@/lib/attendance.constants";
import redis from "@/lib/redis";
import supabase from "@/lib/supabase";
import { verifyMessage } from "ethers";
import { cookies } from "next/headers";
import { SessionResponse } from "web3-connect-react";
import { signInAsAttendant as signInAsAttendantLib } from "@/lib/attendance";

interface SignInAsAttendantUser {
  firstName: string;
  lastName: string;
  userId: string;
  id: number;
}

export async function getAllAttendant(roomId: number): Promise<{
  data?: {
    id: number;
    userId: string;
    firstName: string;
    lastName: string;
    disabled: boolean;
  }[];
  error?: string;
}> {
  const { data: attendants, error } = await supabase()
    .from("attendant")
    .select(
      `
      *,
      admin:user!inner(
        *,
        id:attendance_room!inner(
          *
        )
      )
    `
    )
    .eq("admin.id.id", roomId);

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

  const data = attendants.map((attendant: any) => ({
    userId: attendant.uid,
    id: attendant.id,
    firstName: attendant.first_name,
    lastName: attendant.last_name,
    disabled: !!attendant.wallet_address, // true if wallet exists
  }));

  return {
    data,
  };
}

export async function getAttendantByWalletAddress(
  walletAddress: string
): Promise<{
  data?: SignInAsAttendantUser & { address: string | null };
  error?: string;
}> {
  const { data, error } = await supabase()
    .from("attendant")
    .select("*")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (error) {
    return {
      error: error.message,
    };
  }

  if (!data) {
    return {
      data: undefined,
    };
  }

  return {
    data: {
      id: data.id,
      userId: data.uid,
      firstName: data.first_name ?? "",
      lastName: data.last_name ?? "",
      address: data.wallet_address,
    },
  };
}

export async function hasAttendantTakenAttendanceForToday(
  attendantId: number,
  roomId: number
) {
  if (!attendantId || !roomId) {
    return {
      data: undefined,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data, error } = await supabase()
    .from("attendance_record")
    .select("*")
    .eq("attendant_id", attendantId)
    .eq("attendance_room_id", roomId)
    .gte("created_at", today.toISOString())
    .maybeSingle();

  if (error) {
    return {
      error: error.message,
    };
  }

  return { data };
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

  const userWithWalletAddress = await getAttendantByWalletAddress(address);
  if (userWithWalletAddress.error) {
    return {
      error: userWithWalletAddress.error,
    };
  }
  let userId = userWithWalletAddress.data?.id;

  // check if the attendant with the wallet address exists
  const { error, data: attendant } = await supabase()
    .from("attendant")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    return {
      error: error.message,
    };
  }

  // If attendant has no wallet address, register it
  if (attendant.wallet_address === null) {
    if (userWithWalletAddress.data?.address) {
      return {
        error: "You have already registered a wallet address",
      };
    }

    const { error: updateError, data: updatedAttendant } = await supabase()
      .from("attendant")
      .update({
        wallet_address: address,
      })
      .filter("wallet_address", "is", null)
      .eq("id", user.id)
      .select("*")
      .single();

    if (updateError) {
      return {
        error: updateError.message,
      };
    }
    userId = updatedAttendant.id;
  } else if (attendant.wallet_address !== address) {
    // If attendant already has a different wallet address, throw error
    return {
      error: "This user already has a registered wallet address",
    };
  }

  if (!userId) {
    return {
      error: "User ID not found",
    };
  }

  // Add the attendance record with verified user id
  const { error: addError } = await supabase()
    .from("attendance_record")
    .insert({
      attendance_room_id: roomId,
      attendant_id: userId,
    });

  if (addError) {
    return {
      error: addError.message,
    };
  }

  return {
    error: null,
  };
}
