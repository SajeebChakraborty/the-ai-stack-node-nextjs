import "server-only";

/**
 * Loads .env.production / .env before Prisma reads DATABASE_URL.
 * Fixes production when Prisma initializes before Next.js injects env, or when cwd is
 * `.next/standalone` (no `.env` there — we walk up to the real project root).
 */
import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

function resolveEnvRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 12; i++) {
    if (
      fs.existsSync(path.join(dir, ".env.production")) ||
      fs.existsSync(path.join(dir, ".env.local")) ||
      fs.existsSync(path.join(dir, ".env"))
    ) {
      return dir;
    }
    if (
      fs.existsSync(path.join(dir, "next.config.ts")) ||
      fs.existsSync(path.join(dir, "next.config.mjs")) ||
      fs.existsSync(path.join(dir, "next.config.js"))
    ) {
      return dir;
    }

    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  return process.cwd();
}

const projectDir = resolveEnvRoot();

loadEnvConfig(projectDir);
