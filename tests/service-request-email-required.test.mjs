import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

import { createServiceRequestSchema } from "@/lib/service-request-validation";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

// Daftar layanan yang boleh diajukan, dibaca dari kode (bukan disalin) supaya
// layanan baru otomatis ikut diperiksa.
async function submissionSlugs() {
  const text = await source("src/lib/legacy-request-submit.ts");
  const start = text.indexOf("const supportedSubmissionSlugs = new Set([");
  const end = text.indexOf("]);", start);
  assert.ok(start !== -1 && end !== -1, "daftar supportedSubmissionSlugs tidak ditemukan");

  return [...text.slice(start, end).matchAll(/"([a-z0-9-]+)"/g)].map((match) => match[1]);
}

const base = {
  npm: "140810230017",
  phone: "08123456789",
  bahasaSurat: "id",
};

function emailIssues(result) {
  return result.success
    ? []
    : result.error.issues.filter((issue) => issue.path[0] === "email");
}

test("daftar layanan yang boleh diajukan terbaca (tidak kosong)", async () => {
  const slugs = await submissionSlugs();

  assert.ok(slugs.length >= 16, `hanya ${slugs.length} layanan terbaca`);
});

test("email WAJIB untuk setiap layanan yang bisa diajukan (server menolak tanpa email)", async () => {
  for (const serviceSlug of await submissionSlugs()) {
    for (const email of [undefined, "", "   "]) {
      const issues = emailIssues(
        createServiceRequestSchema.safeParse({ ...base, serviceSlug, email }),
      );

      assert.equal(
        issues.some((issue) => issue.message === "Email wajib diisi."),
        true,
        `${serviceSlug} dengan email ${JSON.stringify(email)} tidak ditolak`,
      );
    }
  }
});

test("format email divalidasi, dan email yang benar tidak menimbulkan masalah email", async () => {
  for (const serviceSlug of await submissionSlugs()) {
    const invalid = emailIssues(
      createServiceRequestSchema.safeParse({ ...base, serviceSlug, email: "bukan-email" }),
    );
    assert.equal(
      invalid.some((issue) => issue.message === "Email tidak valid."),
      true,
      `${serviceSlug}: email tidak valid lolos`,
    );

    const tooLong = emailIssues(
      createServiceRequestSchema.safeParse({
        ...base,
        serviceSlug,
        email: `${"a".repeat(145)}@mail.unpad.ac.id`,
      }),
    );
    assert.equal(tooLong.length > 0, true, `${serviceSlug}: email > 150 karakter lolos`);

    const valid = emailIssues(
      createServiceRequestSchema.safeParse({
        ...base,
        serviceSlug,
        email: "mahasiswa@mail.unpad.ac.id",
      }),
    );
    assert.deepEqual(valid, [], `${serviceSlug}: email valid ditolak`);
  }
});

test("form pengajuan: kolom email wajib, bertipe email, dan terisi otomatis dari data login", async () => {
  const form = await source("src/components/services/service-request-form.tsx");
  const page = await source("src/app/(public)/layanan/[slug]/ajukan/page.tsx");
  const input = form.match(/<Input\s+id="email"[\s\S]*?\/>/)?.[0] ?? "";

  assert.ok(input, "input email tidak ditemukan");
  assert.match(input, /type="email"/);
  assert.match(input, /\brequired\b/);
  assert.match(input, /defaultValue=\{defaultValues\?\.email \?\? ""\}/);
  assert.match(form, /<FieldLabel htmlFor="email" required>/);
  assert.match(page, /email: user\.email,/);
});

test("server: email dari form dipakai, dan bila kosong memakai email dari sesi PAuS, lalu divalidasi skema", async () => {
  const route = await source("src/app/api/services/[slug]/requests/route.ts");

  assert.match(route, /email: body\?\.email \|\| session\.user\.email,/);
  assert.match(route, /createServiceRequestSchema\.parse\(/);
});

test("surat izin kegiatan (SIK): email wajib di form dan divalidasi di server", async () => {
  const workflow = await source("src/components/services/sik-request-workflow.tsx");
  const sik = await source("src/lib/sik-requests.ts");

  assert.match(workflow, /<Input id="email" name="email" type="email" required/);
  assert.match(workflow, /<Input id="emailPengiriman" name="emailPengiriman" type="email" required/);
  assert.match(sik, /function normalizeEmail\(/);
  assert.match(sik, /normalizeRequiredText\(value, label\)/);
  assert.match(sik, /EMAIL_PENGIRIMAN: normalizeEmail\(/);
});
