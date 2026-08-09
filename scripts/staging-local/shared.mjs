import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const rootDir = fileURLToPath(new URL("../..", import.meta.url));
export const projectName = "ult-fmipa-staging-local";
export const envFilePath = path.join(rootDir, "staging-local.env");
export const bootstrapEnvFilePath = path.join(
  rootDir,
  "staging-local.bootstrap.env",
);
export const composeFiles = [
  "docker-compose.yml",
  "docker-compose.staging-local.yml",
];

export function requireEnvFile() {
  if (!existsSync(envFilePath)) {
    console.error(
      "Missing staging-local.env. Copy staging-local.env.example to " +
        "staging-local.env and fill in local-only values first.",
    );
    process.exit(1);
  }
}

export function composeArgs(extra = []) {
  const args = ["compose", "-p", projectName, "--env-file", envFilePath];
  for (const file of composeFiles) {
    args.push("-f", file);
  }
  return [...args, ...extra];
}

export function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      cwd: rootDir,
      ...options,
    });

    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

export async function runOrExit(command, args, options = {}) {
  const code = await run(command, args, options);
  if (code !== 0) {
    process.exit(code);
  }
}

export async function runDocker(extraArgs, options = {}) {
  await runOrExit("docker", composeArgs(extraArgs), options);
}

// Runs a docker compose command and captures stdout (trimmed) instead of
// streaming it to the terminal. Used for small internal checks only (e.g.
// "does this table already exist?") - never for anything that could contain
// secrets.
export function captureDocker(extraArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", composeArgs(extraArgs), {
      cwd: rootDir,
      stdio: ["ignore", "pipe", "inherit"],
    });

    let stdout = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.on("error", reject);
    child.on("exit", (code) => resolve({ code: code ?? 1, stdout: stdout.trim() }));
  });
}
