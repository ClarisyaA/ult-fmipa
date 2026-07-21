import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const [, , distDir, ...nextArgs] = process.argv;

if (!distDir || nextArgs.length === 0) {
  console.error("Usage: node scripts/next-with-dist.mjs <distDir> <next command> [...args]");
  process.exit(1);
}

const nextCli = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);

const child = spawn(process.execPath, [nextCli, ...nextArgs], {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_DIST_DIR: distDir,
  },
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
