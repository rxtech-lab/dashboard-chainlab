import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export const db = getDrizzleClient();

function getDrizzleClient() {
  // For test environment, use the test database URL directly
  if (process.env.IS_TEST === "true") {
    const queryClient = postgres(process.env.DATABASE_URL!);
    return drizzle(queryClient, { schema });
  }

  // For production, use the Neon serverless adapter with WebSockets
  const queryClient = postgres(process.env.DATABASE_URL!, {
    prepare: false,
  });
  
  return drizzle(queryClient, { schema });
}
