"use server";

import { ATTENDANT_COOKIE_NAME } from "@/lib/attendance.constants";
import { cookies } from "next/headers";

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(ATTENDANT_COOKIE_NAME);
}
