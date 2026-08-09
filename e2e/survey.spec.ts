import { expect, test } from "@playwright/test";

import { loginAs } from "./helpers/auth";

test.describe("survey pages", () => {
  test("student survey page loads without crash", async ({ page }) => {
    await loginAs(page, "student", "/survei");
    await expect(
      page.getByRole("heading", { name: "Survei Kepuasan Layanan" })
    ).toBeVisible();
    await expect(page.getByText("Menunggu Survei")).toBeVisible();
  });

  test("admin survey summary loads", async ({ page }) => {
    await loginAs(page, "admin", "/admin/surveys");
    await expect(
      page.getByRole("heading", { name: /ringkasan survei/i })
    ).toBeVisible();
  });

  test("staff survey summary loads", async ({ page }) => {
    await loginAs(page, "staff", "/staff/surveys");
    await expect(
      page.getByRole("heading", { name: /ringkasan survei/i })
    ).toBeVisible();
  });
});
