import "server-only";

/**
 * Loads .env.production / .env before Prisma reads DATABASE_URL.
 * Panel/PM2 often inject empty env vars; we fill missing/blank values from project files.
 */
import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

const ENV_FILE_NAMES = [".env.production.local", ".env.local", ".env.production", ".env"] as const;

function resolveEnvRoot(): string {
  const explicit = process.env.PROJECT_ENV_ROOT?.trim();
  if (explicit && fs.existsSync(explicit)) {
    return explicit;
  }

  let dir = process.cwd();
  let projectRoot = process.cwd();

  for (let i = 0; i < 12; i++) {
    if (
      fs.existsSync(path.join(dir, ".env.production")) ||
      fs.existsSync(path.join(dir, ".env.production.local"))
    ) {
      return dir;
    }

    for (const name of ENV_FILE_NAMES) {
      if (fs.existsSync(path.join(dir, name))) {
        return dir;
      }
    }

    if (
      fs.existsSync(path.join(dir, "next.config.ts")) ||
      fs.existsSync(path.join(dir, "next.config.mjs")) ||
      fs.existsSync(path.join(dir, "next.config.js")) ||
      fs.existsSync(path.join(dir, "package.json"))
    ) {
      projectRoot = dir;
    }

    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  return projectRoot;
}

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const values: Record<string, string> = {};

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function applyEnvFiles(projectDir: string) {
  const isProduction = process.env.NODE_ENV === "production";
  const ordered = isProduction
    ? ([".env.production.local", ".env.local", ".env.production", ".env"] as const)
    : ([".env.local", ".env"] as const);

  for (const name of ordered) {
    const parsed = parseEnvFile(path.join(projectDir, name));
    for (const [key, value] of Object.entries(parsed)) {
      const current = process.env[key];
      if (!current?.trim()) {
        process.env[key] = value;
      }
    }
  }

  // Always trust project files for DATABASE_URL when the process env is blank.
  for (const name of ordered) {
    const parsed = parseEnvFile(path.join(projectDir, name));
    if (parsed.DATABASE_URL?.trim()) {
      process.env.DATABASE_URL = parsed.DATABASE_URL.trim();
      break;
    }
  }
}

const projectDir = resolveEnvRoot();
const isDev = process.env.NODE_ENV !== "production";

loadEnvConfig(projectDir, isDev);
applyEnvFiles(projectDir);

export function getProjectEnvRoot() {
  return projectDir;
}

export function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      `DATABASE_URL is missing. Add it to ${projectDir}/.env.production (current cwd: ${process.cwd()}).`
    );
  }

  return url;
}
