import { Prisma } from "@prisma/client";

export function databaseErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.includes("DATABASE_URL is missing")) {
    return "Server DATABASE_URL is not configured. Add it to .env.production in the site root and restart the Node app.";
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    if (error.errorCode === "P1001") {
      return "Cannot reach MySQL. On a VPS use 127.0.0.1 as the host in DATABASE_URL (not mysql or a remote IP unless the DB listens there).";
    }

    if (error.errorCode === "P1000") {
      return "MySQL rejected the username or password in DATABASE_URL.";
    }

    return "MySQL connection failed. Check DATABASE_URL and that MySQL is running.";
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P1001") {
      return "Cannot reach MySQL. Verify DATABASE_URL host, port, and that MySQL is running.";
    }

    if (error.code === "P1000" || error.code === "P1017") {
      return "MySQL authentication failed. Check the user and password in DATABASE_URL.";
    }
  }

  return "Login failed. Check the MySQL configuration and try again.";
}
