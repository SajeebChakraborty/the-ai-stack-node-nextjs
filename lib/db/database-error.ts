import { Prisma } from "@prisma/client";

/** Prisma request / engine errors where the root cause is usually connection, auth, TLS, timeouts, missing DB name. */
const CONNECTIVITY_CODES = new Set([
  "P1000",
  "P1001",
  "P1002",
  "P1003",
  "P1008",
  "P1011",
  "P1013",
  "P1014",
  "P1017"
]);

/** Schema out of sync with what the app expects. */
const SCHEMA_CODES = new Set(["P2021", "P2022"]);

function hintsFromConnectivityMessage(raw: string | undefined): string | null {
  if (!raw) {
    return null;
  }

  const lower = raw.toLowerCase();

  if (lower.includes("can't reach database") || lower.includes("cannot reach database")) {
    return "Cannot reach MySQL. On a VPS the host in DATABASE_URL is usually `127.0.0.1`; test with `telnet HOST 3306` from the Node host.";
  }

  if (
    lower.includes("server has closed the connection") ||
    lower.includes("connection closed") ||
    lower.includes("econnreset")
  ) {
    return "MySQL closed the connection. Check DATABASE_URL pool settings, timeouts, MySQL limits, or network between app and DB.";
  }

  if (
    lower.includes("econnrefused") ||
    lower.includes("connect econnrefused") ||
    lower.includes("(10061)") ||
    lower.includes("(111)")
  ) {
    return "TCP connection refused — MySQL may not listen on DATABASE_URL's host/port, or a firewall is blocking it.";
  }

  if (lower.includes("access denied") || lower.includes("p1000")) {
    return "MySQL denied the DATABASE_URL user/password, or remote access is forbidden for this user/host.";
  }

  if (
    lower.includes("unknown database") ||
    lower.includes("1049") ||
    lower.includes("(1049)") ||
    lower.includes("p1003")
  ) {
    return "DATABASE_URL names a database that does not exist on that MySQL server — create it or fix the URL.";
  }

  if (lower.includes("etimedout") || lower.includes("timed out") || lower.includes("p1008")) {
    return "Connection to MySQL timed out. Check host, port, firewalls, and whether MySQL is overloaded.";
  }

  if (lower.includes("p1001") || lower.includes("p1017") || lower.includes("p1002")) {
    return "MySQL connectivity error. Verify DATABASE_URL host, port, MySQL bind-address, and that the DB is running.";
  }

  return null;
}

function schemaMessage(code: string) {
  return `Database schema mismatch (${code}). Deploy the latest app and run \`npx prisma db push\` or \`npx prisma migrate deploy\` on the server against this DATABASE_URL.`;
}

export function databaseErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.includes("DATABASE_URL is missing")) {
    return "Server DATABASE_URL is not configured. Add it to .env.production in the site root and restart the Node app.";
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    const fromMsg = hintsFromConnectivityMessage(error.message);
    if (fromMsg) {
      return fromMsg;
    }

    if (error.errorCode === "P1001") {
      return "Cannot reach MySQL. On a VPS use 127.0.0.1 as the host in DATABASE_URL unless MySQL listens elsewhere.";
    }

    if (error.errorCode === "P1000") {
      return "MySQL rejected the username or password in DATABASE_URL.";
    }

    return "Prisma could not start the database engine. Check DATABASE_URL, Prisma engine files, and server logs for the full error.";
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (SCHEMA_CODES.has(error.code)) {
      return schemaMessage(error.code);
    }

    if (CONNECTIVITY_CODES.has(error.code)) {
      return hintsFromConnectivityMessage(error.message) ?? `MySQL connectivity error (${error.code}). Check DATABASE_URL and MySQL.`;
    }
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return (
      hintsFromConnectivityMessage(error.message) ??
      "MySQL query failed (engine error). Check server logs, MySQL error log, and that Prisma schema matches the database."
    );
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return "Prisma database engine panicked. Check server logs; often a schema/runtime mismatch or corrupted client — rebuild and redeploy.";
  }

  if (error instanceof Error) {
    const fromMsg = hintsFromConnectivityMessage(error.message);
    if (fromMsg) {
      return fromMsg;
    }
  }

  return (
    "Sign-in failed for an unexpected reason. If GET /api/health/db returns ok, check Node logs for the stack trace next to this request — " +
    "it may be a schema mismatch (run prisma db push), a pool/timeout issue, or a non-DB error misreported here."
  );
}

export function isProbablyDatabaseConnectivityError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error.message.includes("DATABASE_URL is missing")) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return CONNECTIVITY_CODES.has(error.code);
  }

  return Boolean(hintsFromConnectivityMessage(error.message));
}
