import { requireEnvFile, runDocker } from "./shared.mjs";

requireEnvFile();

console.log(
  "Running storage integrity audit (--strict) inside the staging-local app container...",
);

await runDocker([
  "run",
  "--rm",
  "--no-deps",
  "app",
  "sh",
  "-c",
  "pnpm storage:audit -- --strict",
]);

console.log("Storage audit finished (see output above for CLEAN vs. discrepancies).");
