import { DatabaseError } from "pg";

/**
 * Handle database errors and return appropriate error messages
 */
export function handleDatabaseError(error: unknown): string {
  if (error instanceof DatabaseError) {
    switch (error.code) {
      case "23505": // unique_violation
        return "A record with this value already exists.";
      case "23503": // foreign_key_violation
        return "Operation failed due to foreign key constraint.";
      case "23502": // not_null_violation
        return "Required field is missing.";
      default:
        return `Database error: ${error.code}`;
    }
  }
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred";
}
