import assert from "node:assert/strict";
import test from "node:test";

import {
  detectBufferSignatureMime,
  FileUploadError,
  validateUploadedFile,
  validateUploadedFileBuffer,
} from "../src/lib/file-upload.ts";
import {
  defaultUploadRateLimitConfig,
  getClientIp,
  uploadRateLimiter,
} from "../src/lib/rate-limit.ts";
import {
  authorizeAttachmentAccess,
  evaluateStaffUnitOrAssignmentScope,
} from "../src/lib/attachment-authorization.ts";
import { getMaxUploadSizeOverrideBytes } from "../src/lib/service-upload-config.ts";

test("detectBufferSignatureMime identifies valid signatures", () => {
  const pdfBuffer = Buffer.from("%PDF-1.7 mock content");
  assert.equal(detectBufferSignatureMime(pdfBuffer), "application/pdf");

  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
  ]);
  assert.equal(detectBufferSignatureMime(pngBuffer), "image/png");

  const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  assert.equal(detectBufferSignatureMime(jpegBuffer), "image/jpeg");

  const webpBuffer = Buffer.concat([
    Buffer.from("RIFF"),
    Buffer.from([0x00, 0x00, 0x00, 0x00]),
    Buffer.from("WEBP"),
  ]);
  assert.equal(detectBufferSignatureMime(webpBuffer), "image/webp");
});

test("validateUploadedFileBuffer accepts valid PDF file and signature", () => {
  const file = new File(["%PDF-1.4 test"], "document.pdf", {
    type: "application/pdf",
  });
  const buffer = Buffer.from("%PDF-1.4 test");

  assert.doesNotThrow(() => {
    validateUploadedFileBuffer(file, buffer, "rekomendasi-beasiswa");
  });
});

test("PDF-only route rejects valid PNG/JPEG images", () => {
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  const file = new File([pngHeader], "image.png", { type: "image/png" });

  assert.throws(() => {
    // permohonan-magang-kerja-praktek-ta only accepts PDF
    validateUploadedFileBuffer(file, pngHeader, "permohonan-magang-kerja-praktek-ta");
  }, FileUploadError);
});

test("validateUploadedFileBuffer rejects file named .pdf with invalid signature", () => {
  const file = new File(["This is fake pdf content"], "fake.pdf", {
    type: "application/pdf",
  });
  const buffer = Buffer.from("This is fake pdf content");

  assert.throws(() => {
    validateUploadedFileBuffer(file, buffer, "rekomendasi-beasiswa");
  }, FileUploadError);
});

test("validateUploadedFileBuffer rejects spoofed MIME type", () => {
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  const file = new File([pngHeader], "image.png", { type: "application/pdf" });

  assert.throws(() => {
    validateUploadedFileBuffer(file, pngHeader, "rekomendasi-beasiswa");
  }, FileUploadError);
});

test("validateUploadedFileBuffer rejects executable extensions", () => {
  const buffer = Buffer.from("%PDF-1.4 test");
  const file = new File([buffer], "payload.pdf.exe", {
    type: "application/pdf",
  });

  assert.throws(() => {
    validateUploadedFileBuffer(file, buffer, "rekomendasi-beasiswa");
  }, FileUploadError);
});

test("validateUploadedFileBuffer rejects empty file or buffer", () => {
  const emptyFile = new File([], "empty.pdf", { type: "application/pdf" });
  const emptyBuffer = Buffer.alloc(0);

  assert.throws(() => {
    validateUploadedFile(emptyFile, "rekomendasi-beasiswa");
  }, FileUploadError);

  assert.throws(() => {
    validateUploadedFileBuffer(emptyFile, emptyBuffer, "rekomendasi-beasiswa");
  }, FileUploadError);
});

test("path traversal in original filename is sanitized safely", () => {
  const file = new File(["%PDF-1.4 test"], "../../../etc/passwd.pdf", {
    type: "application/pdf",
  });
  const buffer = Buffer.from("%PDF-1.4 test");

  assert.doesNotThrow(() => {
    validateUploadedFileBuffer(file, buffer, "rekomendasi-beasiswa");
  });
});

test("MAX_UPLOAD_SIZE_MB handles invalid values and bounds safely", () => {
  const originalEnv = process.env.MAX_UPLOAD_SIZE_MB;

  try {
    process.env.MAX_UPLOAD_SIZE_MB = "invalid-string";
    assert.equal(getMaxUploadSizeOverrideBytes(), null);

    process.env.MAX_UPLOAD_SIZE_MB = "-10";
    assert.equal(getMaxUploadSizeOverrideBytes(), null);

    process.env.MAX_UPLOAD_SIZE_MB = "20";
    assert.equal(getMaxUploadSizeOverrideBytes(), 20 * 1024 * 1024);

    process.env.MAX_UPLOAD_SIZE_MB = "100"; // capped at 50 MB
    assert.equal(getMaxUploadSizeOverrideBytes(), 50 * 1024 * 1024);
  } finally {
    if (originalEnv !== undefined) {
      process.env.MAX_UPLOAD_SIZE_MB = originalEnv;
    } else {
      delete process.env.MAX_UPLOAD_SIZE_MB;
    }
  }
});

test("getClientIp parses first address safely", () => {
  const reqMultiple = new Request("http://localhost", {
    headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178" },
  });
  assert.equal(getClientIp(reqMultiple), "203.0.113.195");

  const reqPort = new Request("http://localhost", {
    headers: { "x-real-ip": "198.51.100.1:8080" },
  });
  assert.equal(getClientIp(reqPort), "198.51.100.1");
});

test("upload rate limiter blocks excessive requests for a user", () => {
  const keyUserA = "upload:user-A:127.0.0.1";
  const keyUserB = "upload:user-B:127.0.0.1";
  const config = { windowMs: 60000, maxRequests: 3 };

  uploadRateLimiter.reset();

  assert.equal(
    uploadRateLimiter.check("default-test", defaultUploadRateLimitConfig).success,
    true
  );

  assert.equal(uploadRateLimiter.check(keyUserA, config).success, true);
  assert.equal(uploadRateLimiter.check(keyUserA, config).success, true);
  assert.equal(uploadRateLimiter.check(keyUserA, config).success, true);
  assert.equal(uploadRateLimiter.check(keyUserA, config).success, false);

  // User B is not blocked by User A's limit
  assert.equal(uploadRateLimiter.check(keyUserB, config).success, true);
});

test("staff scope policy is explicitly documented as global fallback", () => {
  const mockUser = { id: "1", role: "STAFF" };
  const mockAttachment = { ID: BigInt(1) };
  const mockRequest = { id: "1", sourceTable: "masih_kuliah" };

  assert.equal(
    evaluateStaffUnitOrAssignmentScope(mockUser, mockAttachment, mockRequest),
    true
  );
});

test("authorizeAttachmentAccess rejects unauthenticated users", async () => {
  const result = await authorizeAttachmentAccess(null, "1");
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "UNAUTHORIZED");
});
