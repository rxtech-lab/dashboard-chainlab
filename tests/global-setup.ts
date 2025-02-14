import { execSync } from "child_process";
import dotenv from "dotenv";
import path from "path";

async function globalSetup() {
  // Load environment variables based on NODE_ENV
  const envFile = ".env.test";
  dotenv.config({
    path: path.resolve(process.cwd(), envFile),
  });
}

export default globalSetup;
