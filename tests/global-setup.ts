import { execSync } from "child_process";
import dotenv from "dotenv";
import path from "path";

async function globalSetup() {
  const envFile = ".env.test";
  dotenv.config({
    path: path.resolve(process.cwd(), envFile),
  });

  // Push schema to test database
  execSync("npx drizzle-kit push --force", {
    env: { ...process.env, TURSO_DATABASE_URL: "file:./test.db" },
    stdio: "inherit",
  });
}

export default globalSetup;
