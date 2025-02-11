"use server";

import { isAuthenticated } from "@/lib/auth";
import supabase from "@/lib/supabase";
import { cookies } from "next/headers";

export async function getAttendance(id: number) {
  const cookieStore = await cookies();
  const { error, session } = await isAuthenticated(cookieStore);

  if (error) {
    return { error: error };
  }

  const { data, error: err } = await supabase()
    .from("attendance_room")
    .select("*")
    .eq("id", id)
    .eq("created_by", session!.id)
    .single();

  if (err) {
    return { error: err.message };
  }

  return { data: data };
}
