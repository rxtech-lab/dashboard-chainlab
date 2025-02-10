import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

// generate types: supabase gen types typescript --project-id abcdefghijklmnopqrst > database.types.ts
const supabase = () =>
  createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

export default supabase;
