import assert from "node:assert/strict";
import test from "node:test";

import {
  extractStoredName,
  getStorageReference,
  normalizeStorageReference,
  resolveObjectKey,
  getStorageAreaForProfileType,
} from "../src/lib/storage-paths.ts";
import { assertMinioConfigured, isObjectNotFoundError } from "../src/lib/minio-storage.ts";

test("getStorageReference builds the current object-key format", () => {
  assert.equal(getStorageReference("uploads", "abc.pdf"), "uploads/abc.pdf");
  assert.equal(getStorageReference("information", "abc.webp"), "information/abc.webp");
  assert.equal(getStorageReference("homeActivities", "abc.jpg"), "home-activities/abc.jpg");
  assert.equal(
    getStorageReference("profileOrganization", "abc.png"),
    "profile/organization/abc.png"
  );
  assert.equal(getStorageReference("profileLocation", "abc.png"), "profile/location/abc.png");
});

test("getStorageAreaForProfileType maps profile types correctly", () => {
  assert.equal(getStorageAreaForProfileType("organization"), "profileOrganization");
  assert.equal(getStorageAreaForProfileType("location"), "profileLocation");
});

test("extractStoredName tolerates every legacy reference shape", () => {
  assert.equal(extractStoredName("abc.pdf"), "abc.pdf");
  assert.equal(extractStoredName("uploads/abc.pdf"), "abc.pdf");
  assert.equal(extractStoredName("storage/uploads/abc.pdf"), "abc.pdf");
  assert.equal(extractStoredName("/storage/uploads/abc.pdf"), "abc.pdf");
  assert.equal(extractStoredName("storage\\uploads\\abc.pdf"), "abc.pdf");
  assert.equal(extractStoredName("D:\\app\\storage\\uploads\\abc.pdf"), "abc.pdf");
  assert.equal(extractStoredName(""), null);
  assert.equal(extractStoredName(null), null);
  assert.equal(extractStoredName(undefined), null);
  assert.equal(extractStoredName("abc.pdf\0.exe"), null);
  assert.equal(extractStoredName("uploads/.."), null);
  assert.equal(extractStoredName("uploads/."), null);
});

test("resolveObjectKey accepts a bare stored file name", () => {
  assert.equal(resolveObjectKey("uploads", "abc-123.pdf"), "uploads/abc-123.pdf");
  assert.equal(
    resolveObjectKey("profileOrganization", "photo.png"),
    "profile/organization/photo.png"
  );
});

test("resolveObjectKey rejects empty, null, and null-byte input", () => {
  assert.equal(resolveObjectKey("uploads", null), null);
  assert.equal(resolveObjectKey("uploads", undefined), null);
  assert.equal(resolveObjectKey("uploads", ""), null);
  assert.equal(resolveObjectKey("uploads", "abc\0.pdf"), null);
});

test("resolveObjectKey rejects path traversal segments", () => {
  assert.equal(resolveObjectKey("uploads", ".."), null);
  assert.equal(resolveObjectKey("uploads", "../etc/passwd"), null);
  assert.equal(resolveObjectKey("uploads", "../../secret.pdf"), null);
  assert.equal(resolveObjectKey("uploads", "sub/../../etc/passwd"), null);
});

test("resolveObjectKey rejects absolute paths and drive letters", () => {
  assert.equal(resolveObjectKey("uploads", "/etc/passwd"), null);
  assert.equal(resolveObjectKey("uploads", "\\etc\\passwd"), null);
  assert.equal(resolveObjectKey("uploads", "C:\\Windows\\system32\\file.pdf"), null);
  assert.equal(resolveObjectKey("uploads", "D:/secret.pdf"), null);
});

test("resolveObjectKey rejects any embedded path separator (nested key)", () => {
  assert.equal(resolveObjectKey("uploads", "sub/abc.pdf"), null);
  assert.equal(resolveObjectKey("uploads", "sub\\abc.pdf"), null);
});

test("normalizeStorageReference maps every legacy DB reference shape to a safe object key", () => {
  assert.equal(normalizeStorageReference("uploads", "abc.pdf"), "uploads/abc.pdf");
  assert.equal(normalizeStorageReference("uploads", "storage/uploads/abc.pdf"), "uploads/abc.pdf");
  assert.equal(normalizeStorageReference("uploads", "/storage/uploads/abc.pdf"), "uploads/abc.pdf");
  assert.equal(
    normalizeStorageReference("uploads", "storage\\uploads\\abc.pdf"),
    "uploads/abc.pdf"
  );
  assert.equal(normalizeStorageReference("uploads", null), null);
  assert.equal(normalizeStorageReference("uploads", ""), null);
});

test("assertMinioConfigured throws a clear, secret-free error when config is missing", () => {
  const originalEnv = {
    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
    MINIO_PORT: process.env.MINIO_PORT,
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
    MINIO_BUCKET: process.env.MINIO_BUCKET,
    MINIO_USE_SSL: process.env.MINIO_USE_SSL,
  };

  try {
    delete process.env.MINIO_ENDPOINT;
    delete process.env.MINIO_PORT;
    delete process.env.MINIO_ACCESS_KEY;
    delete process.env.MINIO_SECRET_KEY;
    delete process.env.MINIO_BUCKET;
    delete process.env.MINIO_USE_SSL;

    assert.throws(() => assertMinioConfigured(), (error) => {
      assert.match(error.message, /MINIO_ENDPOINT/);
      assert.match(error.message, /MINIO_ACCESS_KEY/);
      assert.doesNotMatch(error.message, /secret-value-should-never-appear/);
      return true;
    });

    process.env.MINIO_ENDPOINT = "localhost";
    process.env.MINIO_PORT = "not-a-number";
    process.env.MINIO_ACCESS_KEY = "key";
    process.env.MINIO_SECRET_KEY = "secret";
    process.env.MINIO_BUCKET = "bucket";

    assert.throws(() => assertMinioConfigured(), /MINIO_PORT/);

    process.env.MINIO_PORT = "9000";
    process.env.MINIO_USE_SSL = "maybe";

    assert.throws(() => assertMinioConfigured(), /MINIO_USE_SSL/);

    process.env.MINIO_USE_SSL = "false";

    assert.doesNotThrow(() => assertMinioConfigured());
  } finally {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});

test("isObjectNotFoundError recognizes MinIO not-found error codes", () => {
  assert.equal(isObjectNotFoundError({ code: "NotFound" }), true);
  assert.equal(isObjectNotFoundError({ code: "NoSuchKey" }), true);
  assert.equal(isObjectNotFoundError({ code: "AccessDenied" }), false);
  assert.equal(isObjectNotFoundError(new Error("boom")), false);
  assert.equal(isObjectNotFoundError(null), false);
});
