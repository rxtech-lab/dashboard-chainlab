"use server";

import { cookies } from "next/headers";

export async function createRoom(roomId: string) {
  const cookie = await cookies();
}
