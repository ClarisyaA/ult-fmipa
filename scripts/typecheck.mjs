import { rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const typecheckDistDir = ".next-typecheck";
const nextCli = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);
const tscCli = fileURLToPath(
  new URL("../node_modules/typescript/bin/tsc", import.meta.url),
);

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      ...options,
    });

    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

await rm(typecheckDistDir, { recursive: true, force: true });

const env = {
  ...process.env,
  NEXT_DIST_DIR: typecheckDistDir,
};

const typegenCode = await run(process.execPath, [nextCli, "typegen"], { env });
if (typegenCode !== 0) {
  process.exit(typegenCode);
}

const tscCode = await run(
  process.execPath,
  [tscCli, "--project", "tsconfig.typecheck.json", "--noEmit"],
  { env },
);

process.exit(tscCode);
