import { expect, test } from "@playwright/test";

import { clearSession, loginAs } from "./helpers/auth";

test.describe("surat izin kegiatan staged workflow", () => {
  test("student proof, admin approval, final submit, and process status", async ({
    page,
  }) => {
    let requestId = "";

    try {
      await loginAs(page, "student", "/layanan/surat-izin-kegiatan/ajukan");
      await expect(page.getByTestId("sik-proof-submit")).toBeVisible();

      await page.locator("#attachments").setInputFiles({
        name: "bukti-acc-sik.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4\n% SIK proof E2E\n"),
      });

      const proofResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/services/surat-izin-kegiatan/requests") &&
          response.request().method() === "POST"
      );

      await page.getByTestId("sik-proof-submit").click();

      const proofResponse = await proofResponsePromise;
      expect(proofResponse.status()).toBe(200);

      const historyResponse = await page.request.get("/api/student/requests");
      expect(historyResponse.status()).toBe(200);
      const historyBody = await historyResponse.json();
      const sikRequest = historyBody?.data?.find(
        (request: { serviceSlug: string; status: string }) =>
          request.serviceSlug === "surat-izin-kegiatan" &&
          request.status === "sikApprovalPending"
      );

      requestId = sikRequest?.id;
      expect(requestId).toBeDefined();

      await clearSession(page);
      await loginAs(
        page,
        "admin",
        `/admin/requests/surat-izin-kegiatan/${requestId}`
      );

      const approvalResponse = await page.request.patch(
        `/api/admin/requests/surat-izin-kegiatan/${requestId}/approval`,
        {
          data: {
            action: "approve",
          },
        }
      );
      expect(approvalResponse.status()).toBe(200);

      await clearSession(page);
      await loginAs(page, "student", "/layanan/surat-izin-kegiatan/ajukan");
      await expect(page.getByTestId("sik-final-submit")).toBeVisible();

      await page.locator("#namaHimpunan").fill("Himpunan E2E");
      await page.locator("#namaKegiatan").fill("Kegiatan SIK E2E");
      await page.locator("#tanggalKegiatan").fill("2026-07-20");
      await page.locator("#emailPengiriman").fill("student@gmail.com");
      await page.locator("#noHpWa").fill("081234567890");
      await page.locator("#attachments").setInputFiles({
        name: "spik-final.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4\n% SIK final E2E\n"),
      });

      const finalResponsePromise = page.waitForResponse(
        (response) =>
          response
            .url()
            .includes(
              `/api/services/surat-izin-kegiatan/requests/${requestId}/final`
            ) && response.request().method() === "PATCH"
      );

      await page.getByTestId("sik-final-submit").click();

      const finalResponse = await finalResponsePromise;
      expect(finalResponse.status()).toBe(200);

      await clearSession(page);
      await loginAs(
        page,
        "admin",
        `/admin/requests/surat-izin-kegiatan/${requestId}`
      );

      const processResponse = await page.request.patch(
        `/api/admin/requests/surat-izin-kegiatan/${requestId}/status`,
        {
          data: {
            action: "process",
            staffName: "Admin ULT",
          },
        }
      );
      expect(processResponse.status()).toBe(200);
    } finally {
      if (requestId) {
        await clearSession(page);
        await loginAs(page, "admin", "/admin/requests");
        await page.request.delete(
          `/api/admin/requests/surat-izin-kegiatan/${requestId}`
        );
      }
    }
  });
});
