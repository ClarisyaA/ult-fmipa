import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

import {
  PAUS_DEFAULTS,
  buildPausSignOutUrl,
  getBerandaUrl,
  getPausEndpoints,
  isPausBridgeEnabled,
  isPausGlobalLogoutEnabled,
  resolvePausLogoutTarget,
} from "@/lib/paus-config";
import {
  LOGIN_ERROR_ALUMNI_NOT_ALLOWED,
  getLoginErrorMessage,
} from "@/lib/paus-login-policy";
import {
  describePausProfileShape,
  isPausAlumniProfile,
  mapPausProfileToSessionUser,
  normalizePausStudentProfile,
  pickPausValue,
} from "@/lib/paus-profile";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

// --- Endpoint mengikuti panduan resmi PAuS SSO v1.0 ---

test("default endpoint, scope, dan cara kirim token sesuai panduan resmi", () => {
  const endpoints = getPausEndpoints({});

  assert.equal(endpoints.authorizationUrl, "https://paus.unpad.ac.id/oauth/authorize");
  assert.equal(endpoints.tokenUrl, "https://paus.unpad.ac.id/oauth/token");
  assert.equal(endpoints.userinfoUrl, "https://paus.unpad.ac.id/api/user");
  assert.equal(endpoints.scope, "read-user-info");
  assert.equal(endpoints.userinfoAuth, "bearer");
  assert.equal(endpoints.signOutRedirectParam, "redirect_uri");
  assert.equal(PAUS_DEFAULTS.signOutUrl, "https://paus.unpad.ac.id/oauth/sign-out");
});

test("endpoint bisa diganti lewat environment (mis. kembali ke endpoint lama)", () => {
  const endpoints = getPausEndpoints({
    PAUS_AUTHORIZATION_URL: " https://paus.unpad.ac.id/oauth ",
    PAUS_TOKEN_URL: "https://paus.unpad.ac.id/oauth/access-token",
    PAUS_USERINFO_URL: "https://paus.unpad.ac.id/api/",
    PAUS_SCOPE: "user.basic",
    PAUS_USERINFO_AUTH: "QUERY",
  });

  assert.equal(endpoints.authorizationUrl, "https://paus.unpad.ac.id/oauth");
  assert.equal(endpoints.tokenUrl, "https://paus.unpad.ac.id/oauth/access-token");
  assert.equal(endpoints.userinfoUrl, "https://paus.unpad.ac.id/api/");
  assert.equal(endpoints.scope, "user.basic");
  assert.equal(endpoints.userinfoAuth, "query");
});

test("nilai kosong atau spasi memakai default, nilai tidak dikenal untuk userinfo auth jatuh ke bearer", () => {
  const endpoints = getPausEndpoints({
    PAUS_TOKEN_URL: "   ",
    PAUS_SCOPE: "",
    PAUS_USERINFO_AUTH: "basic",
  });

  assert.equal(endpoints.tokenUrl, PAUS_DEFAULTS.tokenUrl);
  assert.equal(endpoints.scope, PAUS_DEFAULTS.scope);
  assert.equal(endpoints.userinfoAuth, "bearer");
});

test("PAuS Bridge mati secara default dan hanya hidup bila dinyalakan eksplisit", () => {
  assert.equal(isPausBridgeEnabled({}), false);
  assert.equal(isPausBridgeEnabled({ PAUS_BRIDGE_ENABLED: "false" }), false);
  assert.equal(isPausBridgeEnabled({ PAUS_BRIDGE_ENABLED: "1" }), false);
  assert.equal(isPausBridgeEnabled({ PAUS_BRIDGE_ENABLED: " TRUE " }), true);
});

// --- Logout -> beranda ---

test("sign-out PAuS memuat client_id dan tujuan kembali yang di-encode", () => {
  const url = new URL(
    buildPausSignOutUrl({
      signOutUrl: "https://paus.unpad.ac.id/oauth/sign-out",
      clientId: "abc123",
      redirectUri: "https://ult.fmipa.unpad.ac.id/",
    }),
  );

  assert.equal(url.origin + url.pathname, "https://paus.unpad.ac.id/oauth/sign-out");
  assert.equal(url.searchParams.get("client_id"), "abc123");
  assert.equal(url.searchParams.get("redirect_uri"), "https://ult.fmipa.unpad.ac.id/");
});

test("beranda dibentuk dari NEXTAUTH_URL (hanya origin + /), dengan cadangan yang aman", () => {
  assert.equal(
    getBerandaUrl({ NEXTAUTH_URL: "https://ult.fmipa.unpad.ac.id/login?x=1" }),
    "https://ult.fmipa.unpad.ac.id/",
  );
  assert.equal(getBerandaUrl({}, "http://127.0.0.1:3000"), "http://127.0.0.1:3000/");
  assert.equal(getBerandaUrl({ NEXTAUTH_URL: "bukan-url" }, "http://localhost:3100"), "http://localhost:3100/");
  assert.equal(getBerandaUrl({}), "http://localhost:3000/");
});

test("target logout mahasiswa PAuS = sign-out PAuS dengan kembali ke beranda", () => {
  const target = new URL(
    resolvePausLogoutTarget({
      NEXTAUTH_URL: "https://ult.fmipa.unpad.ac.id",
      PAUS_CLIENT_ID: "client-1",
    }),
  );

  assert.equal(target.origin, "https://paus.unpad.ac.id");
  assert.equal(target.pathname, "/oauth/sign-out");
  assert.equal(target.searchParams.get("client_id"), "client-1");
  assert.equal(target.searchParams.get("redirect_uri"), "https://ult.fmipa.unpad.ac.id/");
});

test("logout langsung ke beranda bila logout global dimatikan, client id kosong, atau URL sign-out rusak", () => {
  const base = { NEXTAUTH_URL: "https://ult.fmipa.unpad.ac.id" };

  assert.equal(
    resolvePausLogoutTarget({ ...base, PAUS_CLIENT_ID: "x", PAUS_GLOBAL_LOGOUT: "false" }),
    "https://ult.fmipa.unpad.ac.id/",
  );
  assert.equal(resolvePausLogoutTarget({ ...base }), "https://ult.fmipa.unpad.ac.id/");
  assert.equal(
    resolvePausLogoutTarget({ ...base, PAUS_CLIENT_ID: "x", PAUS_SIGN_OUT_URL: "bukan url" }),
    "https://ult.fmipa.unpad.ac.id/",
  );
  assert.equal(isPausGlobalLogoutEnabled({}), true);
  assert.equal(isPausGlobalLogoutEnabled({ PAUS_GLOBAL_LOGOUT: "FALSE" }), false);
});

test("nama parameter tujuan sign-out bisa diganti", () => {
  const target = new URL(
    resolvePausLogoutTarget({
      NEXTAUTH_URL: "https://ult.fmipa.unpad.ac.id",
      PAUS_CLIENT_ID: "x",
      PAUS_SIGN_OUT_REDIRECT_PARAM: "post_logout_redirect_uri",
    }),
  );

  assert.equal(target.searchParams.get("post_logout_redirect_uri"), "https://ult.fmipa.unpad.ac.id/");
  assert.equal(target.searchParams.get("redirect_uri"), null);
});

// --- Pembaca profil: beberapa bentuk data ---

test("bentuk lama: attributes.<field>.attribute_value", () => {
  const user = mapPausProfileToSessionUser({
    attributes: {
      npm: { attribute_value: ["140810260001"] },
      nama: { attribute_value: "Ani Contoh" },
      paus_id: { attribute_value: "PAUS-1" },
    },
  });

  assert.equal(user.npm, "140810260001");
  assert.equal(user.name, "Ani Contoh");
  assert.equal(user.id, "PAUS-1");
  assert.equal(user.role, "MAHASISWA");
});

test("bentuk datar: paus_id, nama, npm (sesuai keterangan DPSI)", () => {
  const user = mapPausProfileToSessionUser({
    paus_id: "PAUS-77",
    nama: "Budi Contoh",
    npm: "140810260002",
  });

  assert.equal(user.npm, "140810260002");
  assert.equal(user.name, "Budi Contoh");
  assert.equal(user.pausId, "PAUS-77");
  assert.equal(user.id, "PAUS-77");
  assert.equal(user.email, undefined);
});

test("bentuk panduan PDF: email + name, NPM diambil dari akun aktif pertama", () => {
  const user = mapPausProfileToSessionUser({
    email: "ani@mail.unpad.ac.id",
    name: "Ani Contoh",
    phone: "0812",
    accounts: [
      { is_active: false, npm: "999999999999" },
      { is_active: true, npm: "140810260003" },
    ],
  });

  assert.equal(user.npm, "140810260003");
  assert.equal(user.name, "Ani Contoh");
  assert.equal(user.email, "ani@mail.unpad.ac.id");
});

test("NPM hanya di akun tidak aktif atau tidak ada sama sekali ditolak", () => {
  assert.equal(
    normalizePausStudentProfile({ accounts: [{ is_active: false, npm: "1408" }] }),
    null,
  );
  assert.equal(normalizePausStudentProfile({ email: "x@unpad.ac.id", name: "X" }), null);
  assert.equal(normalizePausStudentProfile({ nip: "1980", nama: "Dosen" }), null);
});

test("NPM berupa angka atau array dibaca sebagai teks; spasi dibuang", () => {
  assert.equal(normalizePausStudentProfile({ npm: 140810260004 }).npm, "140810260004");
  assert.equal(normalizePausStudentProfile({ npm: ["  ", " 1408 "] }).npm, "1408");
  assert.equal(normalizePausStudentProfile({ npm: "  " }), null);
});

test("id sesi: paus_id, lalu sub, lalu id, lalu turunan NPM", () => {
  assert.equal(mapPausProfileToSessionUser({ npm: "1", sub: "s-1", id: 9 }).id, "s-1");
  assert.equal(mapPausProfileToSessionUser({ npm: "1", id: 9 }).id, "9");
  assert.equal(mapPausProfileToSessionUser({ npm: "1" }).id, "paus-npm-1");
});

test("pickPausValue: attributes didahulukan, lalu datar, lalu akun aktif", () => {
  const profile = {
    attributes: { status: { attribute_value: "A" } },
    status: "B",
    accounts: [{ is_active: true, status: "C", extra: "D" }],
  };

  assert.equal(pickPausValue(profile, ["status"]), "A");
  assert.equal(pickPausValue(profile, ["extra"]), "D");
  assert.equal(pickPausValue(profile, ["tidak-ada"]), undefined);
  assert.equal(pickPausValue(null, ["status"]), undefined);
});

// --- Penolakan alumni memakai penanda PAuS ---

test("penolakan alumni nonaktif selama PAUS_ALUMNI_FIELD kosong", () => {
  assert.equal(isPausAlumniProfile({ status: "alumni" }, {}), false);
  assert.equal(isPausAlumniProfile({ status: "alumni" }, { PAUS_ALUMNI_FIELD: "" }), false);
});

test("alumni ditolak berdasarkan field dan nilai yang dikonfigurasi (tidak peka huruf besar)", () => {
  const env = { PAUS_ALUMNI_FIELD: "status" };

  assert.equal(isPausAlumniProfile({ status: "Alumni" }, env), true);
  assert.equal(isPausAlumniProfile({ status: "LULUS" }, env), true);
  assert.equal(isPausAlumniProfile({ status: "aktif" }, env), false);
  assert.equal(isPausAlumniProfile({}, env), false);
  assert.equal(
    isPausAlumniProfile({ attributes: { status: { attribute_value: "alumni" } } }, env),
    true,
  );
  assert.equal(
    isPausAlumniProfile({ jenis: "Purna" }, { PAUS_ALUMNI_FIELD: "jenis", PAUS_ALUMNI_VALUES: "purna" }),
    true,
  );
});

test("mode PAUS_ACTIVE_VALUES: hanya nilai yang disebut yang boleh masuk, kosong ditolak", () => {
  const env = { PAUS_ALUMNI_FIELD: "status", PAUS_ACTIVE_VALUES: "aktif, cuti" };

  assert.equal(isPausAlumniProfile({ status: "aktif" }, env), false);
  assert.equal(isPausAlumniProfile({ status: "Cuti" }, env), false);
  assert.equal(isPausAlumniProfile({ status: "lulus" }, env), true);
  assert.equal(isPausAlumniProfile({}, env), true);
});

test("pesan penolakan alumni jelas dan tidak memuat data pribadi", () => {
  assert.match(getLoginErrorMessage(LOGIN_ERROR_ALUMNI_NOT_ALLOWED), /alumni.*hubungi ULT FMIPA/i);
  assert.doesNotMatch(getLoginErrorMessage(LOGIN_ERROR_ALUMNI_NOT_ALLOWED), /\d{6,}/);
});

// --- Log diagnosis bentuk profil (tanpa nilai) ---

test("describePausProfileShape hanya memuat nama field dan tipe, tidak pernah nilai", () => {
  const profile = {
    paus_id: "PAUS-RAHASIA-123",
    nama: "Nama Pribadi Sungguhan",
    npm: 140810269999,
    email: null,
    attributes: { nip: { attribute_value: ["198001012005011001"] } },
    accounts: [{ is_active: true, npm: "140810269999" }],
  };
  const shape = describePausProfileShape(profile);

  assert.match(shape, /paus_id:string/);
  assert.match(shape, /npm:number/);
  assert.match(shape, /email:null/);
  assert.match(shape, /accounts:array\(1\)\[\{is_active:boolean, npm:string\}\]/);
  assert.match(shape, /attributes:\{nip:\{attribute_value:array\(1\)\[string\]\}\}/);
  assert.doesNotMatch(shape, /RAHASIA|Pribadi|1980|1408/);
  assert.equal(describePausProfileShape(null), "null");
  assert.equal(describePausProfileShape([]), "array(0)");
});

test("log bentuk profil hanya aktif bila AUTH_DEBUG=true dan tidak memanggil console dengan profil mentah", async () => {
  const auth = await source("src/lib/auth.ts");
  const logIndex = auth.indexOf("userinfo shape:");
  const before = auth.slice(Math.max(0, logIndex - 400), logIndex);

  assert.ok(logIndex > -1);
  assert.match(before, /process\.env\.AUTH_DEBUG === "true"/);
  assert.match(auth, /describePausProfileShape\(profile\)/);
  assert.doesNotMatch(auth, /console\.\w+\([^)]*,\s*profile\s*\)/);
});

// --- Pengait di auth.ts dan file konfigurasi ---

test("auth.ts: alumni ditolak sebelum pengecekan tabel mahasiswa, hanya untuk provider paus", async () => {
  const auth = await source("src/lib/auth.ts");
  const alumni = auth.indexOf("isPausAlumniProfile(profile)");
  const registry = auth.indexOf("checkPausStudentRegistered(user.npm)");

  assert.ok(alumni > -1 && registry > -1 && alumni < registry);
  assert.match(auth, /account\.provider === "paus" && isPausAlumniProfile\(profile\)/);
  assert.match(auth, /\/login\?error=\$\{LOGIN_ERROR_ALUMNI_NOT_ALLOWED\}/);
});

test("profil tanpa NPM tidak melempar error di profile(): ditolak lewat signIn dengan redirect, tanpa mencetak profil ke log", async () => {
  const auth = await source("src/lib/auth.ts");
  const provider = auth.slice(
    auth.indexOf("function createPausProvider"),
    auth.indexOf("function createPausBridgeProvider"),
  );

  assert.match(provider, /try \{\s*return mapPausProfileToSessionUser\(profile\);\s*\} catch \{/);
  assert.match(provider, /id: "paus-ineligible"/);
  // pengguna pengganti tidak punya NPM, jadi tidak lolos pengecekan kelayakan
  assert.doesNotMatch(provider, /npm:/);
  assert.equal(getLoginErrorMessage("AccessDenied").includes("NPM yang valid"), true);
});

test("auth.ts: PAuS Bridge hanya terdaftar bila dinyalakan, scope dari konfigurasi", async () => {
  const auth = await source("src/lib/auth.ts");

  assert.match(auth, /\.\.\.\(isPausBridgeEnabled\(\) \? \[createPausBridgeProvider\(\)\] : \[\]\)/);
  assert.match(auth, /scope: pausEndpoints\.scope/);
  assert.doesNotMatch(auth, /"user\.basic"/);
});

test("file konfigurasi memakai endpoint panduan resmi, bukan endpoint lama", async () => {
  for (const file of [".env.example", "docker-compose.yml", "k8s/02-configmap.yaml"]) {
    // Komentar boleh menyebut endpoint lama (petunjuk kembali ke gaya lama).
    const text = (await source(file))
      .split("\n")
      .filter((line) => !line.trim().startsWith("#"))
      .join("\n");

    assert.match(text, /https:\/\/paus\.unpad\.ac\.id\/oauth\/authorize/, file);
    assert.match(text, /https:\/\/paus\.unpad\.ac\.id\/oauth\/token/, file);
    assert.match(text, /https:\/\/paus\.unpad\.ac\.id\/api\/user/, file);
    assert.doesNotMatch(text, /oauth\/access-token/, file);
  }
});

test("route logout PAuS tidak menerima input pengguna untuk tujuan redirect", async () => {
  const route = await source("src/app/api/paus/logout/route.ts");

  assert.doesNotMatch(route, /searchParams|nextUrl\.search|request\.json|formData/);
  assert.match(route, /resolvePausLogoutTarget\(process\.env, origin\)/);
});
