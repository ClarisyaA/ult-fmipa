import { expect, test } from "@playwright/test";

import { loginAs } from "./helpers/auth";

test.describe("information pages", () => {
  test("public information page loads", async ({ page }) => {
    await page.goto("/informasi");
    await expect(page.getByTestId("information-page")).toBeVisible();
    await expect(
      page
        .getByText("Belum ada informasi yang dipublikasikan.")
        .or(page.getByRole("link", { name: "Baca Informasi" }).first())
    ).toBeVisible();
  });

  test("admin information pages and form are available", async ({ page }) => {
    await loginAs(page, "admin", "/admin/informasi");
    await expect(page.getByText("Kelola Informasi")).toBeVisible();

    await page.goto("/admin/informasi/tambah");
    await expect(page.getByText("Tambah Informasi")).toBeVisible();
    await expect(page.getByTestId("information-title")).toBeVisible();
    await expect(page.getByTestId("information-content")).toBeVisible();
    await expect(page.getByText("Pratinjau Tautan")).toBeVisible();
    await expect(page.getByLabel(/slug/i)).toHaveCount(0);
    await expect(page.getByText("Tautan Singkat")).toHaveCount(0);
  });

  test("staff information page loads", async ({ page }) => {
    await loginAs(page, "staff", "/staff/informasi");
    await expect(page.getByText("Kelola Informasi")).toBeVisible();
  });
});
