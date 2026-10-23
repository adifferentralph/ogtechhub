import { existsSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// The canonical Sites deployment runs the API with D1 and R2. Vercel builds
// the UI as standard Next.js and proxies /api requests to that backend.
const apiDirectory = fileURLToPath(new URL("../app/api", import.meta.url));
const heldApiDirectory = fileURLToPath(new URL("../.vercel-api-hold", import.meta.url));
const nextCli = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));

if (existsSync(heldApiDirectory)) {
  throw new Error("Refusing to build while .vercel-api-hold already exists.");
}

let moved = false;
try {
  if (existsSync(apiDirectory)) {
    renameSync(apiDirectory, heldApiDirectory);
    moved = true;
  }

  const result = spawnSync(process.execPath, [nextCli, "build"], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    env: process.env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status ?? 1;
} finally {
  if (moved) renameSync(heldApiDirectory, apiDirectory);
}
