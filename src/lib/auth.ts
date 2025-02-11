"server-only";

import { ethers } from "ethers";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import supabase from "./supabase";
import { ADMIN_COOKIE_NAME } from "./auth.constants";
import { SessionResponse } from "web3-connect-react";
import { SignJWT, jwtVerify } from "jose";
import { createSecretKey } from "crypto";
import redis from "./redis";
import { Database } from "./database.types";
import { Config, getAdminSignInMessage } from "@/config/config";
import dayjs from "dayjs";

export async function isAuthenticated(cookie: ReadonlyRequestCookies) {
  const session = await getSession(cookie);
  if (session.isAuth === false) {
    return {
      error: "Unauthorized",
    };
  }
  return {
    error: null,
    session,
  };
}

export async function getSession(
  cookie: ReadonlyRequestCookies
): Promise<
  | (SessionResponse & Database["public"]["Tables"]["user"]["Row"])
  | { isAuth: false }
> {
  const token = cookie.get(ADMIN_COOKIE_NAME);
  if (!token) {
    return {
      isAuth: false,
    };
  }
  const value = await jwtVerify(
    token.value,
    createSecretKey(process.env.JWT_SECRET!, "utf-8")
  );

  return value.payload as any;
}

/**
 * Save the session in the cookie. This will also verify the session
 * @param cookie - The cookie to save the session in
 * @param session - The session to save
 */
export async function saveSession(
  cookie: ReadonlyRequestCookies,
  session: SessionResponse & { signature: string; message: string }
): Promise<{ error?: string }> {
  // verify the session
  const walletAddress = session.walletAddress!;
  const signature = session.signature;
  const nonce = await redis.get(`nonce:${walletAddress}`);
  if (!nonce) {
    return {
      error: "Nonce not found",
    };
  }
  const message = getAdminSignInMessage(nonce as string);
  const isValid = verifyMessageSignature(message, signature, walletAddress);
  if (!isValid) {
    return {
      error: "Invalid signature",
    };
  }

  // verify the permission
  const [isAdmin, user, error] = await adminOnly(walletAddress);
  if (error) {
    return {
      error,
    };
  }

  if (!isAdmin) {
    return {
      error: "User is not an admin",
    };
  }

  // sign the session
  const expireAt = dayjs()
    .add(Config.Authentication.defaultCookieExpiration, "seconds")
    .toDate();
  const secretKey = createSecretKey(process.env.JWT_SECRET!, "utf-8");
  const token = await new SignJWT({
    ...session,
    ...user,
  } as any)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expireAt)
    .sign(secretKey);
  cookie.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expireAt,
  });
  return {
    error: undefined,
  };
}

/**
 * Verify the sign in message
 * @param message - The message to verify
 * @param signature - The signature to verify
 * @param walletAddress - The wallet address to verify
 * @returns True if the message is valid, false otherwise
 */
export function verifyMessageSignature(
  message: string,
  signature: string,
  walletAddress: string
) {
  const signer = ethers.verifyMessage(message, signature);
  return signer === walletAddress;
}

/**
 * Check if the user is an admin
 * @param walletAddress - The wallet address to check
 * @returns True if the user is an admin, false otherwise
 */
async function adminOnly(
  walletAddress: string
): Promise<
  [boolean, Database["public"]["Tables"]["user"]["Row"] | null, string | null]
> {
  const { data, error } = await supabase()
    .from("user")
    .select("*")
    .eq("wallet_address", walletAddress);

  if (error) {
    console.error(error);
    return [false, null, error.message];
  }

  if (data.length === 0) {
    return [false, null, "User not found"];
  }

  const user = data[0];
  if (user.role !== "ADMIN") {
    return [false, null, "User is not an admin"];
  }

  return [true, user, null];
}

export async function signIn(
  message: string,
  signature: string,
  walletAddress: string
) {
  const isValid = verifyMessageSignature(message, signature, walletAddress);
  if (!isValid) {
    return [false, "Invalid signature"];
  }

  const [isAdmin, error] = await adminOnly(walletAddress);
  if (!isAdmin) {
    return [false, "User is not an admin"];
  }
}
