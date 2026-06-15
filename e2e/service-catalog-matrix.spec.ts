import { expect, test } from "@playwright/test";

import { loginAs } from "./helpers/auth";
import { serviceSlugs } from "./helpers/services";

test.describe("service catalog route matrix", () => {
  test("all service slugs routes and API load without crash", async ({ page, request }) => {
    // Login once as student
    await loginAs(page, "student", "/layanan");

    for (const slug of serviceSlugs) {
      // 1. GET /api/services/[slug] returns 200
      const res = await request.get(`/api/services/${slug}`);
      expect(res.status()).toBe(200);

      // 2. /layanan/[slug] opens without crash
      await page.goto(`/layanan/${slug}`);
      await expect(page.getByTestId("service-detail-page")).toBeVisible();

      // 3. /layanan/[slug]/ajukan opens without crash
      await page.goto(`/layanan/${slug}/ajukan`);
      await expect(page.getByTestId("service-submit-page")).toBeVisible();

      // 4. Shows form or unsupported message
      const form = page.getByTestId("service-request-form");
      const unavailable = page.getByText(/belum tersedia/i);
      await expect(form.or(unavailable)).toBeVisible();
    }
  });
});
