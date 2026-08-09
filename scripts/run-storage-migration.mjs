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

const forwardedArgs = process.argv.slice(2);

const code = await run(process.execPath, [
  "--experimental-strip-types",
  "--import",
  loaderPath,
  "scripts/migrate-local-storage-to-minio.ts",
  ...forwardedArgs,
]);

process.exit(code);
