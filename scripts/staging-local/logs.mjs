import { requireEnvFile, runDocker } from "./shared.mjs";

requireEnvFile();

// Extra args passed after `pnpm staging:local:logs --` (e.g. a different
// service name) are forwarded as-is. Defaults to the app service, streaming
// its stdout/stderr only - not container environment variables.
const extraArgs = process.argv.slice(2);
const target = extraArgs.length ? extraArgs : ["app"];

await runDocker(["logs", "-f", ...target]);
