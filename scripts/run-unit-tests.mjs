import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const loaderPath = pathToFileURL(
  path.join(rootDir, "scripts", "alias-loader.mjs")
).href;

function run(command, args, options = {}) {
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

const code = await run(process.execPath, [
  "--experimental-strip-types",
  "--import",
  loaderPath,
  "--test",
  "tests/security-upload-attachment.test.mjs",
  "tests/role-access.test.mjs",
  "tests/storage-minio.test.mjs",
  "tests/cms-and-workflow-fixes.test.mjs",
  "tests/home-activity-images.test.mjs",
  "tests/mobile-hotspot-dialog.test.mjs",
  "tests/request-completion-dialog.test.mjs",
  "tests/staging-local-rehearsal.test.mjs",
  "tests/admin-user-pagination.test.mjs",
  "tests/paus-integration-audit.test.mjs",
]);

process.exit(code);
