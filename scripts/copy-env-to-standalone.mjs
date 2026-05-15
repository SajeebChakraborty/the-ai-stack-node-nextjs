import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");
const names = [".env.production.local", ".env.production", ".env.local", ".env"];

if (!fs.existsSync(standaloneDir)) {
  console.log("copy-env-to-standalone: no .next/standalone yet, skipping");
  process.exit(0);
}

let copied = 0;

for (const name of names) {
  const source = path.join(root, name);
  const target = path.join(standaloneDir, name);

  if (!fs.existsSync(source)) {
    continue;
  }

  fs.copyFileSync(source, target);
  copied += 1;
  console.log(`copy-env-to-standalone: copied ${name}`);
}

if (!copied) {
  console.warn("copy-env-to-standalone: no env files found in project root");
}
