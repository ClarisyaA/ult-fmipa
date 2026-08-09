import { requireEnvFile, runDocker } from "./shared.mjs";

requireEnvFile();

await runDocker(["ps"]);
