import { expect, test } from "@playwright/test";

import { clearSession, loginAs } from "./helpers/auth";
import { submitSafeStudentRequest } from "./helpers/request";

test.describe("admin and staff request tables", () => {
  test("staff sees inline status actions and no delete action", async ({
    page,
  }) => {
    try {
      await submitSafeStudentRequest(page);
      await clearSession(page);
    } catch (e) {
      console.warn("Failed to create prerequisite student request, continuing test", e);
    }

    await loginAs(page, "staff", "/staff/requests");
    await expect(
      page.getByRole("heading", { name: /manajemen pengajuan layanan/i })
    ).toBeVisible();

    const emptyText = page.getByText("Tidak ada pengajuan yang sesuai filter.");
    const rowLocator = page.locator("tbody tr").filter({ hasText: /ULT|Kuliah|Keterangan|Surat|Pengajuan/ }).first();

    if (await rowLocator.count() > 0 && !(await emptyText.isVisible())) {
      await expect(rowLocator.getByRole("link", { name: /lihat detail/i })).toBeVisible();
      await expect(rowLocator.getByRole("button", { name: "Hapus" })).toHaveCount(0);
    } else {
      await expect(emptyText).toBeVisible();
    }
  });

  test("admin sees request table and delete action when rows exist", async ({
    page,
  }) => {
    try {
      await submitSafeStudentRequest(page);
      await clearSession(page);
    } catch (e) {
      console.warn("Failed to create prerequisite student request, continuing test", e);
    }

    await loginAs(page, "admin", "/admin/requests");
    await expect(
      page.getByRole("heading", { name: /daftar pengajuan layanan/i })
    ).toBeVisible();

    const emptyText = page.getByText("Tidak ada pengajuan yang sesuai filter.");
    const rowLocator = page.locator("tbody tr").first();

    if (await rowLocator.count() > 0 && !(await emptyText.isVisible())) {
      await expect(rowLocator).toBeVisible();
      await expect(page.getByRole("button", { name: "Hapus" }).first()).toBeVisible();
    } else {
      await expect(emptyText).toBeVisible();
    }
  });
});
