import { expect, test } from "@playwright/test";

import { submitSafeStudentRequest } from "./helpers/request";

test.describe("student request flow", () => {
  test("student can submit a safe service request without attachment", async ({
    page,
  }) => {
    await submitSafeStudentRequest(page);

    await page.getByRole("link", { name: "Lihat Riwayat Pengajuan" }).click();
    await expect(page).toHaveURL(/\/mahasiswa\/riwayat$/);
    await expect(
      page.getByRole("heading", { name: /riwayat pengajuan/i })
    ).toBeVisible();
  });
});

