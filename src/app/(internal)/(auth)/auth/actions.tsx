"use server";

import { saveSession } from "@/lib/auth";
import { ADMIN_COOKIE_NAME } from "@/lib/auth.constants";
import { cookies } from "next/headers";
import { SessionResponse } from "web3-connect-react";
import { v4 as uuidv4 } from "uuid";
import redis from "@/lib/redis";
import { Config, getAdminSignInMessage } from "@/config/config";

export async function getSignInMessage(walletAddress: string) {
  const nonce = uuidv4();
  const key = `nonce:${walletAddress}`;
  await redis.set(key, nonce);
  await redis.expire(key, Config.Authentication.defaultNonceExpiration);
  return {
    message: getAdminSignInMessage(nonce),
    nonce,
  };
}

export async function signIn(session: SessionResponse) {
  const cookieStore = await cookies();
  return saveSession(cookieStore, session as any);
}

export async function signOut() {
  const cookie = await cookies();
  cookie.delete(ADMIN_COOKIE_NAME);
}
