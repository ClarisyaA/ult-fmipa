// Memeriksa seluruh alur login + logout PAuS terhadap aplikasi yang sedang berjalan
// dan PAuS tiruan (scripts/mock-paus.mjs). Tidak butuh credential asli.
//
// Siapkan dulu (lihat docs/paus-sso-alignment.md):
//   1. node scripts/mock-paus.mjs
//   2. jalankan aplikasi dengan PAUS_* diarahkan ke tiruan, mis. di port 3010
//   3. node scripts/check-paus-flow.mjs
//
// Env: APP_URL (default http://localhost:3010), MOCK_URL (default http://localhost:4010),
//      EXPECT_REGISTRY=true bila pemeriksaan NPM ke tabel mahasiswa aktif,
//      EXPECT_ALUMNI=true bila PAUS_ALUMNI_FIELD=status diaktifkan di aplikasi.
const APP = (process.env.APP_URL ?? "http://localhost:3010").replace(/\/$/, "");
const MOCK = (process.env.MOCK_URL ?? "http://localhost:4010").replace(/\/$/, "");
const EXPECT_REGISTRY = process.env.EXPECT_REGISTRY === "true";
const EXPECT_ALUMNI = process.env.EXPECT_ALUMNI === "true";

let failures = 0;
function check(ok, label, detail) {
  console.log(`${ok ? "  PASS" : "  FAIL"}  ${label}${!ok && detail ? `  -> ${detail}` : ""}`);
  if (!ok) failures++;
}

class Jar {
  cookies = new Map();
  store(response) {
    for (const line of response.headers.getSetCookie?.() ?? []) {
      const [pair] = line.split(";");
      const index = pair.indexOf("=");
      const name = pair.slice(0, index).trim();
      const value = pair.slice(index + 1).trim();
      if (!value || /Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(line)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }
  header() {
    return [...this.cookies].map(([name, value]) => `${name}=${value}`).join("; ");
  }
  has(namePart) {
    return [...this.cookies.keys()].some((name) => name.includes(namePart));
  }
}

async function http(jar, url, init = {}) {
  const response = await fetch(url, {
    redirect: "manual",
    ...init,
    headers: { ...(init.headers ?? {}), ...(jar.header() ? { Cookie: jar.header() } : {}) },
  });
  jar.store(response);
  return response;
}

async function login(as) {
  const jar = new Jar();

  const csrf = await (await http(jar, `${APP}/api/auth/csrf`)).json();
  const start = await http(jar, `${APP}/api/auth/signin/paus`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken: csrf.csrfToken, callbackUrl: `${APP}/` }),
  });
  const authorizeUrl = start.headers.get("location");

  if (!authorizeUrl) return { jar, authorizeUrl: null, error: "tidak ada redirect ke PAuS" };

  const authorize = new URL(authorizeUrl);
  authorize.searchParams.set("as", as);
  const granted = await fetch(authorize, { redirect: "manual" });
  const callbackUrl = granted.headers.get("location");

  if (!callbackUrl) return { jar, authorizeUrl, error: `PAuS menolak: ${granted.status}` };

  const callback = await http(jar, callbackUrl);
  const finalLocation = callback.headers.get("location") ?? "";
  const session = await (await http(jar, `${APP}/api/auth/session`)).json();

  // Untuk penolakan, ikuti rantai redirect internal NextAuth sampai halaman akhir
  // (mis. /api/auth/signin -> /login?error=...). Redirect sukses ke beranda tidak diikuti.
  const chain = [];
  let next = finalLocation;
  for (let hop = 0; hop < 5 && next; hop++) {
    const resolved = new URL(next, APP);
    chain.push(resolved.pathname + resolved.search);
    if (!resolved.pathname.startsWith("/api/auth/")) break;
    const response = await http(jar, resolved.toString());
    next = response.status >= 300 && response.status < 400 ? response.headers.get("location") ?? "" : "";
  }
  const landing = chain.at(-1) ?? "";

  return { jar, authorizeUrl, callbackUrl, finalLocation, session, chain, landing };
}

async function main() {
  console.log(`Aplikasi : ${APP}\nPAuS tiruan: ${MOCK}\n`);
  await fetch(`${MOCK}/__reset`, { method: "POST" }).catch(() => null);

  console.log("1. Provider dan permintaan authorize");
  const providers = await (await fetch(`${APP}/api/auth/providers`)).json();
  check(Boolean(providers.paus), "provider 'paus' terdaftar (client id & secret terisi)");

  const ok = await login("mahasiswa");
  check(Boolean(ok.authorizeUrl), "klik login mengarahkan ke PAuS", ok.error);

  if (ok.authorizeUrl) {
    const params = new URL(ok.authorizeUrl).searchParams;
    check(new URL(ok.authorizeUrl).pathname === "/oauth/authorize", "authorize ke /oauth/authorize");
    check(params.get("response_type") === "code", "response_type=code");
    check(params.get("scope") === "read-user-info", "scope=read-user-info", params.get("scope"));
    check(params.get("redirect_uri") === `${APP}/api/auth/callback/paus`, "redirect_uri = callback NextAuth", params.get("redirect_uri"));
    check((params.get("state") ?? "").length >= 20, "state acak ada", String((params.get("state") ?? "").length));
  }

  console.log("\n2. Mahasiswa terdaftar masuk");
  check(!ok.finalLocation?.includes("error="), "callback tidak menghasilkan error", ok.finalLocation);
  check(ok.jar.has("session-token"), "cookie sesi dibuat");
  check(ok.session?.user?.role === "MAHASISWA", "role MAHASISWA", JSON.stringify(ok.session?.user));
  check(ok.session?.user?.npm === "ZZMOCK000001", "NPM terbaca dari profil PAuS", ok.session?.user?.npm);
  check(ok.session?.user?.provider === "paus", "provider tersimpan = paus", ok.session?.user?.provider);
  check(!JSON.stringify(ok.session ?? {}).match(/access_token|accessToken/i), "token PAuS tidak bocor ke sesi");

  const log = await (await fetch(`${MOCK}/__log`)).json();
  const kinds = log.events.map((event) => event.type);
  check(kinds.includes("token.ok"), "tukar kode ke token berhasil");
  const userinfo = log.events.find((event) => event.type === "userinfo.ok");
  check(userinfo?.via === "header", "userinfo memakai header Bearer", userinfo?.via);
  const tokenEvent = log.events.find((event) => event.type === "token.ok");
  check(tokenEvent?.accept === "application/json", "token request mengirim Accept: application/json", tokenEvent?.accept);

  console.log("\n3. Logout -> sign-out PAuS -> beranda");
  const csrf = await (await http(ok.jar, `${APP}/api/auth/csrf`)).json();
  await http(ok.jar, `${APP}/api/auth/signout`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken: csrf.csrfToken, json: "true" }),
  });
  const afterSignOut = await (await http(ok.jar, `${APP}/api/auth/session`)).json();
  check(!afterSignOut?.user, "sesi ULT terhapus");

  const step = await http(ok.jar, `${APP}/api/paus/logout`);
  const signOutUrl = step.headers.get("location") ?? "";
  const target = signOutUrl ? new URL(signOutUrl) : null;
  check([302, 303, 307, 308].includes(step.status) && target?.pathname === "/oauth/sign-out", "/api/paus/logout mengarah ke sign-out PAuS", `${step.status} ${signOutUrl}`);
  check(Boolean(target?.searchParams.get("client_id")), "sign-out membawa client_id");
  check(target?.searchParams.get("redirect_uri") === `${APP}/`, "tujuan kembali = beranda", target?.searchParams.get("redirect_uri"));
  if (signOutUrl) {
    const back = await fetch(signOutUrl, { redirect: "manual" });
    check(back.headers.get("location") === `${APP}/`, "PAuS mengembalikan pengguna ke beranda", back.headers.get("location"));
  }

  console.log("\n4. Ditolak dengan benar");
  const dosen = await login("dosen");
  check(!dosen.session?.user, "dosen/tendik (tanpa NPM) tidak dapat sesi", JSON.stringify(dosen.session));
  check(
    dosen.landing.startsWith("/login") && /error=/.test(dosen.landing),
    "pengguna berakhir di /login dengan kode error (agar pesan tampil)",
    `rantai: ${dosen.chain.join(" -> ")}`,
  );

  if (EXPECT_REGISTRY) {
    const unknown = await login("tidakterdaftar");
    check(!unknown.session?.user, "NPM tidak ada di tabel mahasiswa tidak dapat sesi");
    check(unknown.landing.includes("error=NpmNotRegistered"), "pesan NpmNotRegistered", unknown.landing);
  }

  if (EXPECT_ALUMNI) {
    const alumni = await login("alumni");
    check(!alumni.session?.user, "alumni tidak dapat sesi");
    check(alumni.landing.includes("error=AlumniNotAllowed"), "pesan AlumniNotAllowed", alumni.landing);
  }

  console.log(failures === 0 ? "\nSEMUA PEMERIKSAAN LULUS" : `\n${failures} PEMERIKSAAN GAGAL`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("Skrip gagal dijalankan:", error.message);
  process.exit(2);
});
