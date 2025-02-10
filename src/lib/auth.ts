"server-only";

import { ethers } from "ethers";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import supabase from "./supabase";
import { COOKIE_NAME, SIGN_IN_MESSAGE } from "./auth.constants";
import { SessionResponse } from "web3-connect-react";
import { SignJWT, jwtVerify } from "jose";
import { createSecretKey } from "crypto";
import redis from "./redis";

export function isAuthenticated(cookie: ReadonlyRequestCookies) {
  const token = cookie.get(COOKIE_NAME);
  if (!token) {
    return false;
  }

  return true;
}

export async function getSession(
  cookie: ReadonlyRequestCookies
): Promise<SessionResponse | { isAuth: false }> {
  const token = cookie.get(COOKIE_NAME);
  if (!token) {
    return {
      isAuth: false,
    };
  }
  const value = await jwtVerify(
    token.value,
    createSecretKey(process.env.JWT_SECRET!, "utf-8")
  );

  return value.payload as unknown as SessionResponse;
}

export function concatMessage(message: string, nonce: string) {
  return `${message}\n\nNonce: ${nonce}`;
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
  const message = concatMessage(SIGN_IN_MESSAGE, nonce as string);
  const isValid = verifyMessageSignature(message, signature, walletAddress);
  if (!isValid) {
    return {
      error: "Invalid signature",
    };
  }

  // verify the permission
  const [isAdmin, error] = await adminOnly(walletAddress);
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
  const secretKey = createSecretKey(process.env.JWT_SECRET!, "utf-8");
  const token = await new SignJWT(session as any)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("144h")
    .sign(secretKey);
  cookie.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 144 * 60 * 60,
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
): Promise<[boolean, string | null]> {
  const { data, error } = await supabase()
    .from("user")
    .select("*")
    .eq("wallet_address", walletAddress);

  if (error) {
    console.error(error);
    return [false, error.message];
  }

  if (data.length === 0) {
    return [false, "User not found"];
  }

  const user = data[0];
  if (user.role !== "ADMIN") {
    return [false, "User is not an admin"];
  }

  return [true, null];
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
