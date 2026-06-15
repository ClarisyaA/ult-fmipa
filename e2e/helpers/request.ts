import { expect, type Page } from "@playwright/test";

import { loginAs } from "./auth";

export async function submitSafeStudentRequest(page: Page) {
  await loginAs(page, "student", "/layanan/keterangan-masih-kuliah/ajukan");
  await page.getByTestId("request-semester").fill("6");
  await page.getByTestId("request-tahun-akademik").fill("2025/2026");
  await page.getByTestId("request-description").fill("Smoke test E2E");
  await page.getByTestId("service-request-submit").click();
  await expect(page.getByTestId("request-success")).toBeVisible();
}

