import { requireEnvFile, runDocker } from "./shared.mjs";

requireEnvFile();

// Intentionally no `-v`: containers/network are removed, named volumes
// (database + MinIO data) are preserved.
await runDocker(["down"]);

console.log(
  "Local staging containers and network removed. Volumes were preserved (no -v was used). " +
    "Local development stack was not touched.",
);
