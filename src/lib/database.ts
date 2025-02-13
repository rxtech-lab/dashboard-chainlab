import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

let prisma: PrismaClient;

// if we are running in test mode, we use the local database
// otherwise we use the neon database by adding the adapter
if (process.env.IS_TEST) {
  prisma = new PrismaClient();
} else {
  neonConfig.webSocketConstructor = ws;
  const connectionString = `${process.env.DATABASE_URL}`;

  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  prisma = new PrismaClient({ adapter });
}
