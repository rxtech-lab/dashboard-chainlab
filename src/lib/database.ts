import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

export const prisma = getPrismaClient();

function getPrismaClient() {
  neonConfig.webSocketConstructor = ws;
  const connectionString = `${process.env.DATABASE_URL}`;
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}
