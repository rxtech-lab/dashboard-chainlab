"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME } from "@/lib/auth.constants";

export async function signOut() {
  const cookie = await cookies();
  cookie.delete(COOKIE_NAME);
}
