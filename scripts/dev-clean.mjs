import { rmSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const nextCacheDir = path.join(projectRoot, "..", ".next");

try {
  rmSync(nextCacheDir, { recursive: true, force: true });
  console.log("Cleared .next cache");
} catch (error) {
  console.warn("Could not clear .next cache:", error);
}

const child = spawn("npm", ["run", "dev"], {
  cwd: path.join(projectRoot, ".."),
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
