import fs from "fs";
import path from "path";

async function globalTeardown() {
  const dbPath = path.resolve(process.cwd(), "test.db");
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
}

export default globalTeardown;
