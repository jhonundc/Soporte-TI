import { spawn, execSync } from "node:child_process";
import { createRequire } from "node:module";

const PORT = Number(process.env.PORT || 3000);
const useWebpack =
  process.argv.includes("--webpack") ||
  String(process.env.DEV_BUNDLER || "").toLowerCase() === "webpack";
const bundler = useWebpack ? "webpack" : "turbopack";
const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

function freePort(port) {
  if (process.platform !== "win32") {
    try {
      const pids = execSync(`lsof -ti tcp:${port}`, { encoding: "utf8" })
        .split("\n")
        .map((pid) => pid.trim())
        .filter(Boolean);
      for (const pid of pids) {
        execSync(`kill -9 ${pid}`, { stdio: "ignore" });
        console.log(`Freed port ${port} (PID ${pid})`);
      }
    } catch {
      // Puerto libre
    }
    return;
  }

  try {
    const output = execSync(`netstat -ano | findstr :${port}`, {
      encoding: "utf8",
    });
    const pids = new Set();

    for (const line of output.split("\n")) {
      if (!line.includes("LISTENING")) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
    }

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`Freed port ${port} (PID ${pid})`);
      } catch {
        // Proceso ya cerrado
      }
    }
  } catch {
    // Puerto libre
  }
}

freePort(PORT);

const args = ["dev", "--port", String(PORT)];
if (useWebpack) {
  args.push("--webpack");
} else {
  args.push("--turbopack");
}

console.log(`Starting Next.js on http://localhost:${PORT} (${bundler})`);

const child = spawn(process.execPath, ["--max-old-space-size=4096", nextBin, ...args], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
