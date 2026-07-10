import { expect, test } from "@playwright/test";

import { clearSession, loginAs } from "./helpers/auth";

test.describe("development auth", () => {
  test("student can login and reaches layanan", async ({ page }) => {
    await loginAs(page, "student", "/layanan");
    await expect(page.getByTestId("services-page")).toBeVisible();
  });

  test("staff can login and reaches staff dashboard", async ({ page }) => {
    await loginAs(page, "staff", "/staff/dashboard");
    await expect(
      page.getByRole("heading", { name: "Dashboard" })
    ).toBeVisible();
  });

  test("admin can login and reaches admin dashboard", async ({ page }) => {
    await loginAs(page, "admin", "/admin/dashboard");
    await expect(
      page.getByRole("heading", { name: /dashboard admin/i })
    ).toBeVisible();
  });

  test("student cannot access admin or staff dashboards", async ({ page }) => {
    await loginAs(page, "student", "/layanan");

    await page.goto("/admin/dashboard");
    await expect(page).not.toHaveURL(/\/admin\/dashboard$/);
    await expect(page).toHaveURL(/\/layanan$/);

    await clearSession(page);
    await loginAs(page, "student", "/layanan");
    await page.goto("/staff/dashboard");
    await expect(page).not.toHaveURL(/\/staff\/dashboard$/);
    await expect(page).toHaveURL(/\/layanan$/);
  });
});
