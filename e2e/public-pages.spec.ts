import { expect, test } from "@playwright/test";

test.describe("public pages", () => {
  test("main public pages open and guest can see login entry", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("home-page")).toBeVisible();
    await expect(page.getByTestId("navbar-login")).toBeVisible();

    await page.goto("/layanan");
    await expect(page.getByTestId("services-page")).toBeVisible();

    await page.goto("/informasi");
    await expect(page.getByTestId("information-page")).toBeVisible();

    await page.goto("/survei");
    await expect(page.getByTestId("survey-page")).toBeVisible();
    await expect(page.getByTestId("navbar-login")).toBeVisible();
  });
});
