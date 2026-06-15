import { expect, test } from "@playwright/test";

import { loginAs, clearSession } from "./helpers/auth";
import { serviceSlugs, generateE2EMarker, fillServiceForm } from "./helpers/services";

test.describe("full service submission tests @full-service", () => {
  for (const slug of serviceSlugs) {
    test(`submit service request for ${slug} and clean up`, async ({ page }) => {
      // 1. login as student
      await loginAs(page, "student", `/layanan/${slug}/ajukan`);
      await expect(page.getByTestId("service-submit-page")).toBeVisible();

      // Check if submission is supported for this slug on the frontend
      const formVisible = await page.getByTestId("service-request-form").isVisible();
      if (!formVisible) {
        // If not supported, expect a clear unavailable message
        await expect(page.getByText(/belum tersedia/i)).toBeVisible();
        return;
      }

      // Generate marker
      const marker = generateE2EMarker(slug);

      // Fill form
      await fillServiceForm(page, slug, marker);

      // Wait for the POST request response to retrieve request ID
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes(`/api/services/${slug}/requests`) &&
          response.request().method() === "POST"
      );

      // Submit form
      await page.getByTestId("service-request-submit").click();

      // Wait for response and assert success
      const response = await responsePromise;
      expect(response.status()).toBe(200);

      const resBody = await response.json();
      const requestId = resBody?.data?.id;
      expect(requestId).toBeDefined();

      // Assert success state or request ID appears
      await expect(page.getByTestId("request-success")).toBeVisible();
      await expect(page.getByText(requestId)).toBeVisible();

      // Navigate to /mahasiswa/riwayat and assert page loads
      await page.goto("/mahasiswa/riwayat");
      await expect(page.getByRole("heading", { name: /riwayat pengajuan/i })).toBeVisible();

      // Clean up: delete only the created request
      if (requestId) {
        await clearSession(page);
        await loginAs(page, "admin", "/admin/requests");

        const deleteRes = await page.request.delete(`/api/admin/requests/${slug}/${requestId}`);
        expect(deleteRes.status()).toBe(200);
      }
    });
  }
});
