import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

import { isEligiblePausStudentUser } from "@/lib/auth-user-mapper";
import {
  mapPausBridgePayloadToSessionUser,
  verifyPausBridgeToken,
} from "@/lib/paus-bridge-token";
import {
  mapPausProfileToSessionUser,
  normalizePausStudentProfile,
} from "@/lib/paus-profile";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

function block(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  assert.ok(start !== -1, `marker not found: ${startMarker}`);
  const end = endMarker ? text.indexOf(endMarker, start) : text.length;
  return text.slice(start, end === -1 ? text.length : end);
}

// --- Modern PAUS OAuth: normalizePausStudentProfile / mapPausProfileToSessionUser ---

test("profile with a valid NPM maps to MAHASISWA with name/npm mapped", () => {
  const profile = {
    attributes: {
      npm: { attribute_value: "140810230017" },
      nama: { attribute_value: "Budi Santoso" },
    },
    email: "budi@student.unpad.ac.id",
  };
  const user = mapPausProfileToSessionUser(profile);

  assert.equal(user.role, "MAHASISWA");
  assert.equal(user.npm, "140810230017");
  assert.equal(user.name, "Budi Santoso");
  assert.equal(user.email, "budi@student.unpad.ac.id");
});

test("profile with both NPM and NIP still maps to MAHASISWA - NIP never drives role", () => {
  const profile = {
    attributes: {
      npm: { attribute_value: "140810230017" },
      nip: { attribute_value: "198001012005011001" },
    },
  };
  const user = mapPausProfileToSessionUser(profile);

  assert.equal(user.role, "MAHASISWA");
  assert.equal(user.nip, "198001012005011001");
});

test("profile with NIP only (no NPM) is rejected", () => {
  const profile = { attributes: { nip: { attribute_value: "198001012005011001" } } };

  assert.equal(normalizePausStudentProfile(profile), null);
  assert.throws(() => mapPausProfileToSessionUser(profile));
});

test("profile without npm or nip is rejected", () => {
  assert.equal(normalizePausStudentProfile({ attributes: {} }), null);
  assert.throws(() => mapPausProfileToSessionUser({ attributes: {} }));
});

test("profile with a whitespace-only NPM is rejected", () => {
  const profile = { attributes: { npm: { attribute_value: "   " } } };

  assert.equal(normalizePausStudentProfile(profile), null);
  assert.throws(() => mapPausProfileToSessionUser(profile));
});

test("malformed/null/undefined profile is rejected without throwing on property access", () => {
  assert.equal(normalizePausStudentProfile(null), null);
  assert.equal(normalizePausStudentProfile(undefined), null);
  assert.equal(normalizePausStudentProfile({}), null);
  assert.throws(() => mapPausProfileToSessionUser(null));
  assert.throws(() => mapPausProfileToSessionUser({}));
});

test("PAUS OAuth profile mapper never produces STAFF or ADMIN, across several shapes", () => {
  const shapes = [
    { attributes: { npm: { attribute_value: "1" } } },
    { attributes: { npm: { attribute_value: "1" }, nip: { attribute_value: "2" } } },
    { attributes: { npm: { attribute_value: "1" } }, email: "a@b.com" },
  ];

  for (const profile of shapes) {
    const user = mapPausProfileToSessionUser(profile);
    assert.notEqual(user.role, "STAFF");
    assert.notEqual(user.role, "ADMIN");
    assert.equal(user.role, "MAHASISWA");
  }
});

test("name falls back to a generic label when PAUS omits it", () => {
  const profile = { attributes: { npm: { attribute_value: "123" } } };
  const user = mapPausProfileToSessionUser(profile);

  assert.equal(user.name, "Mahasiswa PAUS");
});

test("missing email does not change role and maps to undefined", () => {
  const profile = { attributes: { npm: { attribute_value: "123" } } };
  const user = mapPausProfileToSessionUser(profile);

  assert.equal(user.role, "MAHASISWA");
  assert.equal(user.email, undefined);
});

test("pausId is mapped and used as id when present", () => {
  const profile = {
    attributes: {
      npm: { attribute_value: "123" },
      paus_id: { attribute_value: "PAUS-999" },
    },
    sub: "sub-1",
  };
  const user = mapPausProfileToSessionUser(profile);

  assert.equal(user.pausId, "PAUS-999");
  assert.equal(user.id, "PAUS-999");
});

test("id falls back to sub, then a NPM-derived id - never to email", () => {
  const profileWithSub = {
    attributes: { npm: { attribute_value: "123" } },
    sub: "sub-1",
    email: "x@example.com",
  };
  assert.equal(mapPausProfileToSessionUser(profileWithSub).id, "sub-1");

  const profileNoSub = {
    attributes: { npm: { attribute_value: "123" } },
    email: "x@example.com",
  };
  assert.equal(mapPausProfileToSessionUser(profileNoSub).id, "paus-npm-123");
});

test("NPM is trimmed", () => {
  const profile = { attributes: { npm: { attribute_value: "  123  " } } };
  const user = mapPausProfileToSessionUser(profile);

  assert.equal(user.npm, "123");
});

// --- PAUS Bridge (legacy, non-OAuth): mapPausBridgePayloadToSessionUser / verifyPausBridgeToken ---

test("bridge payload with a valid NPM maps to MAHASISWA", () => {
  const user = mapPausBridgePayloadToSessionUser({
    npm: "140810230017",
    name: "Budi",
    email: "budi@student.unpad.ac.id",
  });

  assert.equal(user.role, "MAHASISWA");
  assert.equal(user.npm, "140810230017");
  assert.equal(user.email, "budi@student.unpad.ac.id");
});

test("bridge payload with NPM and NIP still maps to MAHASISWA", () => {
  const user = mapPausBridgePayloadToSessionUser({ npm: "123", nip: "999" });

  assert.equal(user.role, "MAHASISWA");
  assert.equal(user.nip, "999");
});

test("bridge payload with NIP only (no NPM) is rejected", () => {
  assert.throws(() => mapPausBridgePayloadToSessionUser({ nip: "999" }));
});

test("bridge payload without npm or nip is rejected", () => {
  assert.throws(() => mapPausBridgePayloadToSessionUser({}));
});

test("bridge payload with a whitespace-only NPM is rejected", () => {
  assert.throws(() => mapPausBridgePayloadToSessionUser({ npm: "   " }));
});

test("PAUS Bridge mapper never produces STAFF or ADMIN, across several shapes", () => {
  const shapes = [{ npm: "1" }, { npm: "1", nip: "2" }, { npm: "1", email: "a@b.com" }];

  for (const payload of shapes) {
    const user = mapPausBridgePayloadToSessionUser(payload);
    assert.notEqual(user.role, "STAFF");
    assert.notEqual(user.role, "ADMIN");
    assert.equal(user.role, "MAHASISWA");
  }
});

test("verifyPausBridgeToken still enforces signature and expiry (unchanged by this fix)", () => {
  const secret = "unit-test-bridge-secret-not-real";
  const originalSecret = process.env.PAUS_BRIDGE_SECRET;
  process.env.PAUS_BRIDGE_SECRET = secret;

  try {
    const validPayload = { npm: "123", exp: Math.floor(Date.now() / 1000) + 60 };
    const validPart = Buffer.from(JSON.stringify(validPayload)).toString("base64url");
    const validSig = createHmac("sha256", secret).update(validPart).digest("base64url");
    const verified = verifyPausBridgeToken(`${validPart}.${validSig}`);
    assert.equal(verified.npm, "123");

    const expiredPayload = { npm: "123", exp: Math.floor(Date.now() / 1000) - 60 };
    const expiredPart = Buffer.from(JSON.stringify(expiredPayload)).toString("base64url");
    const expiredSig = createHmac("sha256", secret).update(expiredPart).digest("base64url");
    assert.throws(() => verifyPausBridgeToken(`${expiredPart}.${expiredSig}`));

    assert.throws(() => verifyPausBridgeToken(`${validPart}.not-a-valid-signature`));
  } finally {
    if (originalSecret === undefined) {
      delete process.env.PAUS_BRIDGE_SECRET;
    } else {
      process.env.PAUS_BRIDGE_SECRET = originalSecret;
    }
  }
});

// --- Defense-in-depth signIn callback helper ---

test("isEligiblePausStudentUser requires role MAHASISWA and a non-empty npm", () => {
  assert.equal(isEligiblePausStudentUser({ role: "MAHASISWA", npm: "123" }), true);
  assert.equal(isEligiblePausStudentUser({ role: "MAHASISWA", npm: "  " }), false);
  assert.equal(isEligiblePausStudentUser({ role: "MAHASISWA", npm: undefined }), false);
  assert.equal(isEligiblePausStudentUser({ role: "STAFF", npm: "123" }), false);
  assert.equal(isEligiblePausStudentUser({ role: "ADMIN", npm: "123" }), false);
});

test("NextAuth signIn callback wires the student-only guard for paus and paus-bridge, and leaves other providers untouched", async () => {
  const auth = await source("src/lib/auth.ts");
  const callbacksBlock = block(auth, "callbacks: {", "async jwt(");

  assert.match(
    callbacksBlock,
    /async signIn\(\{ user, account \}\) \{/,
  );
  assert.match(
    callbacksBlock,
    /account\?\.provider === "paus" \|\| account\?\.provider === "paus-bridge"/,
  );
  assert.match(callbacksBlock, /if \(!isEligiblePausStudentUser\(user\)\) \{\s*return false;\s*\}/);
  // Setelah lolos cek NPM dari PAUS, NPM juga harus ada di tabel `mahasiswa`.
  assert.match(callbacksBlock, /return checkPausStudentRegistered\(user\.npm\);/);
  assert.match(callbacksBlock, /return true;/);
});

// --- Credentials (DB-backed Admin/Staff) is unaffected ---

test("Credentials provider still resolves ADMIN/STAFF from APP_ROLE and does not depend on PAUS config", async () => {
  const auth = await source("src/lib/auth.ts");
  const authDbUsers = await source("src/lib/auth-db-users.ts");
  const credentialsBlock = block(
    auth,
    'CredentialsProvider({\n      name: "Development Credentials"',
    'CredentialsProvider({\n      id: "paus-bridge"',
  );

  assert.match(credentialsBlock, /authorizeDbCredentialUser\(email, password\)/);
  assert.doesNotMatch(credentialsBlock, /PAUS_CLIENT_ID|PAUS_CLIENT_SECRET/);
  assert.match(authDbUsers, /resolveAppRole\(\{\s*appRole:\s*user\.APP_ROLE,\s*positionCode:\s*user\.ACCESS_CODE,?\s*\}\)/);
  assert.match(authDbUsers, /verifyLegacyPassword\(password, user\.PASSWORD\)/);
});

test("proxy still enforces role-based access for /admin and /staff regardless of login provider", async () => {
  const proxy = await source("src/proxy.ts");

  assert.match(proxy, /isAdminPath && !isRole\(role, "ADMIN"\)/);
  assert.match(proxy, /isStaffPath && !isRole\(role, "STAFF"\)/);
});

// --- Login UI copy matches the final business rule ---

test("login page offers 'Masuk sebagai Mahasiswa' for PAUS and 'Masuk sebagai Admin/Staff' for Credentials", async () => {
  const loginForm = await source("src/app/login/login-form.tsx");

  assert.match(loginForm, /Masuk sebagai Mahasiswa/);
  assert.match(loginForm, /Masuk sebagai Admin\/Staff/);
  assert.doesNotMatch(loginForm, /Masuk sebagai Pengguna/);
  assert.doesNotMatch(loginForm, /Masuk sebagai Administrator/);
});

test("login page shows a generic, safe error message on a failed PAUS sign-in, with no raw profile/token detail", async () => {
  const loginForm = await source("src/app/login/login-form.tsx");

  const policy = await source("src/lib/paus-login-policy.ts");

  assert.match(loginForm, /getLoginErrorMessage\(searchParams\.get\("error"\)\)/);
  assert.match(
    policy,
    /Login PAUS hanya tersedia untuk mahasiswa aktif dengan NPM yang valid\./,
  );
  assert.doesNotMatch(loginForm, /errorCode\}/);
});

// --- No new dependency, no secret leakage ---

test("no new auth/oauth dependency was added to package.json for this fix", async () => {
  const pkg = JSON.parse(await source("package.json"));
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const suspicious = Object.keys(allDeps).filter((name) =>
    /passport|auth0|oauth(?!.*next-auth)/i.test(name) && name !== "next-auth",
  );

  assert.deepEqual(suspicious, []);
});

test("no PAUS secret is ever exposed via a NEXT_PUBLIC_ variable anywhere in src/", async () => {
  const auth = await source("src/lib/auth.ts");
  const profile = await source("src/lib/paus-profile.ts");
  const bridge = await source("src/lib/paus-bridge-token.ts");

  for (const fileSource of [auth, profile, bridge]) {
    assert.doesNotMatch(fileSource, /NEXT_PUBLIC[A-Z_]*PAUS/);
    assert.doesNotMatch(fileSource, /NEXT_PUBLIC[A-Z_]*SECRET/);
  }
});

test("PAUS debug logging only prints booleans/URLs, never the client secret or client id value", async () => {
  const auth = await source("src/lib/auth.ts");
  const logBlock = block(auth, "function logPausProviderStatus", "logPausProviderStatus();");

  assert.match(logBlock, /Boolean\(process\.env\.PAUS_CLIENT_ID\)/);
  assert.match(logBlock, /Boolean\(process\.env\.PAUS_CLIENT_SECRET\)/);
  assert.doesNotMatch(logBlock, /console\.\w+\([^)]*process\.env\.PAUS_CLIENT_SECRET(?!\s*\))/);
  assert.match(
    logBlock,
    /process\.env\.NODE_ENV !== "development" \|\|\s*process\.env\.AUTH_DEBUG !== "true"/,
  );
});

test("access token and refresh token are never copied into the JWT token or client session", async () => {
  const auth = await source("src/lib/auth.ts");
  const callbacksBlock = block(auth, "callbacks: {", "events: {");

  assert.doesNotMatch(callbacksBlock, /access_?[Tt]oken/);
  assert.doesNotMatch(callbacksBlock, /refresh_?[Tt]oken/);
  assert.doesNotMatch(callbacksBlock, /account\.access_token/);
});

test("PAUS access token is currently sent as a query parameter to userinfo (documented in the audit as needing DPSI confirmation)", async () => {
  const auth = await source("src/lib/auth.ts");
  const providerBlock = block(
    auth,
    "function createPausProvider",
    "export const authOptions",
  );

  assert.match(providerBlock, /url\.searchParams\.set\("access_token", accessToken\)/);
  assert.doesNotMatch(providerBlock, /Authorization:\s*`Bearer/);
});

test("token endpoint client authentication is client_secret_post via form-urlencoded body, not HTTP Basic", async () => {
  const auth = await source("src/lib/auth.ts");
  const providerBlock = block(
    auth,
    "function createPausProvider",
    "export const authOptions",
  );

  assert.match(providerBlock, /token_endpoint_auth_method:\s*"client_secret_post"/);
  assert.match(providerBlock, /"Content-Type":\s*"application\/x-www-form-urlencoded"/);
  assert.doesNotMatch(providerBlock, /Authorization.*Basic/);
});

test("PAUS OAuth provider does not enable PKCE/nonce checks beyond NextAuth's default state check", async () => {
  const auth = await source("src/lib/auth.ts");
  const providerBlock = block(
    auth,
    "function createPausProvider",
    "export const authOptions",
  );

  assert.doesNotMatch(providerBlock, /checks:/);
});

test("PAUS_BRIDGE_SECRET verification rejects the documented placeholder value", async () => {
  const bridge = await source("src/lib/paus-bridge-token.ts");

  assert.match(bridge, /if \(!secret \|\| secret === "change-me"\)/);
});

test("callback URL validation still blocks protocol-relative and cross-origin redirects (open-redirect guard)", async () => {
  const redirect = await source("src/lib/auth-redirect.ts");

  assert.match(redirect, /callbackUrl\.startsWith\("\/\/"\)/);
  assert.match(redirect, /if \(url\.origin !== origin\)/);
});

test("PAUS_SIGN_OUT_URL is not wired into any sign-out call (documents the logout gap, Finding S-5)", async () => {
  const auth = await source("src/lib/auth.ts");
  const logoutButton = await source("src/components/layout/logout-button.tsx");

  assert.doesNotMatch(auth, /fetch\(pausSignOutUrl/);
  assert.match(logoutButton, /signOut\(\{ callbackUrl: "\/" \}\)/);
});
