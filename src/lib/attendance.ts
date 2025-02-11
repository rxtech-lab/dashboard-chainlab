import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { ATTENDANT_COOKIE_NAME } from "./attendance.constants";
import { createSecretKey } from "crypto";
import { jwtVerify, SignJWT } from "jose";
import { Config } from "@/config/config";
import { SessionResponse } from "web3-connect-react";
import dayjs from "dayjs";

/**
 * Get the attendant session from the cookie
 * @param cookie
 * @returns
 */
export async function getAttendantSession(
  cookie: ReadonlyRequestCookies
): Promise<SessionResponse> {
  const token = cookie.get(ATTENDANT_COOKIE_NAME);

  if (!token) {
    return {
      isAuth: false,
    } as any;
  }

  if (!token.value || token.value === "") {
    return {
      isAuth: false,
    } as any;
  }

  const value = await jwtVerify(
    token.value,
    createSecretKey(process.env.JWT_SECRET!, "utf-8")
  );
  return value.payload as any;
}

export async function signInAsAttendant(
  cookie: ReadonlyRequestCookies,
  session: SessionResponse
) {
  const secretKey = createSecretKey(process.env.JWT_SECRET!, "utf-8");

  const expireAt = dayjs()
    .add(Config.Authentication.defaultCookieExpiration, "seconds")
    .toDate();

  const token = await new SignJWT(session as any)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expireAt)
    .sign(secretKey);
  cookie.set(ATTENDANT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expireAt,
  });
}
