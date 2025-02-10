"use server";

import { concatMessage, saveSession } from "@/lib/auth";
import { COOKIE_NAME, SIGN_IN_MESSAGE } from "@/lib/auth.constants";
import { cookies } from "next/headers";
import { SessionResponse } from "web3-connect-react";
import { v4 as uuidv4 } from "uuid";
import redis from "@/lib/redis";
import { Config } from "@/config/config";

export async function getSignInMessage(walletAddress: string) {
  const nonce = uuidv4();
  const key = `nonce:${walletAddress}`;
  await redis.set(key, nonce);
  await redis.expire(key, Config.Authentication.defaultNonceExpiration);
  return {
    message: concatMessage(SIGN_IN_MESSAGE, nonce),
    nonce,
  };
}

export async function signIn(session: SessionResponse) {
  const cookieStore = await cookies();
  return saveSession(cookieStore, session as any);
}

export async function signOut() {
  const cookie = await cookies();
  cookie.delete(COOKIE_NAME);
}
