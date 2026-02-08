import { LibsqlError } from "@libsql/client";

export function handleDbError(error: unknown): string {
  if (error instanceof LibsqlError) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return "A record with this value already exists.";
    }
    if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
      return "Operation failed due to foreign key constraint.";
    }
    return `Database error: ${error.code}`;
  }
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred";
}
