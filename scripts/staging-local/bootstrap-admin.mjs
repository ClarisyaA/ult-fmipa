import { existsSync, readFileSync } from "node:fs";

import { parse } from "dotenv";

import { bootstrapEnvFilePath, composeArgs, requireEnvFile, run } from "./shared.mjs";

requireEnvFile();

if (!existsSync(bootstrapEnvFilePath)) {
  console.error(
    "Missing staging-local.bootstrap.env. Copy staging-local.bootstrap.env.example " +
      "to staging-local.bootstrap.env and fill in a username/email/name/password " +
      "you control, then re-run this command.",
  );
  process.exit(1);
}

const parsed = parse(readFileSync(bootstrapEnvFilePath, "utf8"));

const requiredKeys = [
  "STAGING_BOOTSTRAP_ADMIN_USERNAME",
  "STAGING_BOOTSTRAP_ADMIN_EMAIL",
  "STAGING_BOOTSTRAP_ADMIN_NAME",
  "STAGING_BOOTSTRAP_ADMIN_PASSWORD",
];
const optionalKeys = [
  "STAGING_BOOTSTRAP_ADMIN_ACCESS_CODE",
  "STAGING_BOOTSTRAP_ADMIN_UNIT_ID",
];

for (const key of requiredKeys) {
  if (!parsed[key]) {
    console.error(`Missing ${key} in staging-local.bootstrap.env.`);
    process.exit(1);
  }
}

// Values are forwarded into the one-off container's environment (via the
// docker CLI process's own env + `-e VARNAME` without an inline value), and
// are never passed as command-line arguments or printed to this terminal.
const forwardKeys = [...requiredKeys, ...optionalKeys];
const childEnv = { ...process.env };
const dockerArgs = ["run", "--rm", "--no-deps"];

for (const key of forwardKeys) {
  if (parsed[key]) {
    childEnv[key] = parsed[key];
    dockerArgs.push("-e", key);
  }
}

dockerArgs.push("app", "node", "scripts/staging-local/bootstrap-admin-run.mjs");

console.log(
  "Running one-time Admin bootstrap inside a one-shot staging-local app container. " +
    "The plaintext password is not printed and is never added to the long-running app service's environment.",
);

const code = await run("docker", composeArgs(dockerArgs), { env: childEnv });
process.exit(code);
