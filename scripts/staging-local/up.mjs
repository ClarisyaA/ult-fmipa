import { requireEnvFile, runDocker } from "./shared.mjs";

requireEnvFile();

await runDocker(["up", "-d", "--build"]);

console.log("");
console.log("Local staging stack is up (Compose project: ult-fmipa-staging-local).");
console.log("  App:            http://localhost:3100");
console.log("  Adminer:        http://127.0.0.1:8181 (loopback only)");
console.log("  MinIO API:      http://127.0.0.1:19000 (loopback only)");
console.log("  MinIO Console:  http://127.0.0.1:19001 (loopback only)");
console.log("This did not start or modify the local development stack.");
