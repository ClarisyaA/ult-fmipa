import { requireEnvFile, runDocker } from "./shared.mjs";

requireEnvFile();

// `-q` validates the merged compose config without printing it (the merged
// config would otherwise inline every substituted secret from
// staging-local.env), and without starting any container.
await runDocker(["config", "-q"]);

console.log(
  "OK: docker-compose.yml + docker-compose.staging-local.yml merge into a valid config (project: ult-fmipa-staging-local).",
);
