import { Prisma } from "@prisma/client";

/**
 * Handle Prisma errors and return appropriate error messages
 */
export function handlePrismaError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return "A room with this name already exists.";
      case "P2025":
        return "Record not found.";
      case "P2003":
        return "Operation failed due to foreign key constraint.";
      default:
        return `Database error: ${error.code}`;
    }
  }
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred";
}
