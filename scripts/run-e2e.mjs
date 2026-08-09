import { spawn } from "node:child_process";
import http from "node:http";
import { setTimeout as delay } from "node:timers/promises";

const isWindows = process.platform === "win32";
const pnpmCommand = isWindows ? "pnpm.cmd" : "pnpm";
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const readinessUrl = `${baseUrl}/api/auth/providers`;

function requestStatus(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(response.statusCode ?? 0);
    });

    request.on("error", () => resolve(0));
    request.setTimeout(2_000, () => {
      request.destroy();
      resolve(0);
    });
  });
}

async function waitForServer() {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    const status = await requestStatus(readinessUrl);

    if (status >= 200 && status < 500) {
      return;
    }

    await delay(1_000);
  }

  throw new Error(`Server E2E tidak siap: ${readinessUrl}`);
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: isWindows,
      ...options,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      resolve(code ?? 1);
    });
  });
}

async function stopServer(child) {
  if (child.exitCode !== null) {
    return;
  }

  if (isWindows) {
    await run("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
    }).catch(() => {});
    return;
  }

  child.kill("SIGTERM");
  await delay(500);

  if (child.exitCode === null) {
    child.kill("SIGKILL");
  }
}

const server = spawn(
  process.execPath,
  ["scripts/next-with-dist.mjs", ".next-e2e", "dev"],
  {
    stdio: "inherit",
  },
);

try {
  await waitForServer();

  const hasFullService = process.argv.includes("--full-service");
  const extraArgs = process.argv.slice(2).filter((arg) => arg !== "--full-service");

  if (hasFullService) {
    process.env.E2E_FULL_SERVICE = "true";
  }

  const testCode = await run(
    pnpmCommand,
    ["exec", "playwright", "test", ...extraArgs],
    {
      env: {
        ...process.env,
        PLAYWRIGHT_SKIP_WEB_SERVER: "1",
      },
    }
  );

  await stopServer(server);
  process.exit(testCode);
} catch (error) {
  await stopServer(server);
  console.error(error);
  process.exit(1);
}
