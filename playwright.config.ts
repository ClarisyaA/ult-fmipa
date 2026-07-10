import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "e2e",
  testIgnore: process.env.E2E_FULL_SERVICE === "true" ? [] : ["**/full-service-submission.spec.ts"],
  timeout: 60_000,
  expect: {
    timeout: 30_000,
  },
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEB_SERVER
    ? undefined
    : {
        command:
          process.platform === "win32" ? "pnpm.cmd exec next dev" : "pnpm dev",
        url: `${baseURL}/api/auth/providers`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        gracefulShutdown: { signal: "SIGTERM", timeout: 500 },
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
