import { expect, type Page } from "@playwright/test";

type Role = "admin" | "staff" | "student";

const credentials = {
  admin: {
    email: process.env.DEV_ADMIN_EMAIL ?? "admin@example.com",
    password: process.env.DEV_ADMIN_PASSWORD ?? "change-me",
  },
  staff: {
    email: process.env.DEV_STAFF_EMAIL ?? "staff@example.com",
    password: process.env.DEV_STAFF_PASSWORD ?? "change-me",
  },
  student: {
    email: process.env.DEV_STUDENT_EMAIL ?? "student@example.com",
    password: process.env.DEV_STUDENT_PASSWORD ?? "change-me",
  },
};

export async function loginAs(
  page: Page,
  role: Role,
  callbackUrl = role === "admin"
    ? "/admin/dashboard"
    : role === "staff"
      ? "/staff/dashboard"
      : "/layanan"
) {
  await page.goto(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);

  if (!(await page.getByTestId("login-email").isVisible().catch(() => false))) {
    await page.getByRole("button", { name: "Masuk sebagai Sivitas" }).click();
  }

  await page.getByTestId("login-email").fill(credentials[role].email);
  await page.getByTestId("login-password").fill(credentials[role].password);
  await page.getByTestId("login-submit").click();
  const escapedCallback = callbackUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  await expect(page).toHaveURL(new RegExp(escapedCallback), { timeout: 20_000 });
}

export async function clearSession(page: Page) {
  await page.context().clearCookies();
}
