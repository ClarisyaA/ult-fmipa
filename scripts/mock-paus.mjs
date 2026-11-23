// PAuS SSO tiruan untuk pengujian LOKAL (bukan untuk production).
// Mengikuti "Panduan Integrasi PAuS SSO Unpad" v1.0:
//   GET  /oauth/authorize   -> redirect ke redirect_uri?code=...&state=...
//   POST /oauth/token       -> { access_token, token_type: "Bearer", expires_in }
//   GET  /api/user          -> profil (wajib header Authorization: Bearer)
//   GET  /oauth/sign-out    -> redirect ke tujuan kembali (client_id + redirect_uri)
//   GET  /__log             -> catatan kejadian (untuk skrip pemeriksa)
//
// Pakai:  node scripts/mock-paus.mjs   (default http://localhost:4010)
// Env     : MOCK_PAUS_PORT, MOCK_PAUS_CLIENT_ID, MOCK_PAUS_CLIENT_SECRET,
//           MOCK_PAUS_REDIRECT_URIS (pisah koma), MOCK_PAUS_SIGNOUT_REDIRECTS (pisah koma),
//           MOCK_PAUS_SHAPE = flat | attributes | accounts, MOCK_PAUS_ACCEPT_QUERY=true
import http from "node:http";
import { randomBytes } from "node:crypto";

const PORT = Number(process.env.MOCK_PAUS_PORT ?? 4010);
const CLIENT_ID = process.env.MOCK_PAUS_CLIENT_ID ?? "mock-client-id";
const CLIENT_SECRET = process.env.MOCK_PAUS_CLIENT_SECRET ?? "mock-client-secret";
const list = (value, fallback) =>
  (value ?? fallback).split(",").map((item) => item.trim()).filter(Boolean);
const REDIRECT_URIS = list(
  process.env.MOCK_PAUS_REDIRECT_URIS,
  "http://localhost:3000/api/auth/callback/paus,http://localhost:3010/api/auth/callback/paus",
);
const SIGNOUT_REDIRECTS = list(
  process.env.MOCK_PAUS_SIGNOUT_REDIRECTS,
  "http://localhost:3000/,http://localhost:3010/",
);
const SHAPE = process.env.MOCK_PAUS_SHAPE ?? "flat";
const ACCEPT_QUERY = process.env.MOCK_PAUS_ACCEPT_QUERY === "true";

// NPM contoh sengaja berawalan ZZMOCK agar mudah dikenali dan dibersihkan.
const USERS = {
  mahasiswa: {
    label: "Mahasiswa terdaftar (NPM ada di tabel mahasiswa)",
    paus_id: "MOCK-001",
    nama: "Mahasiswa Contoh",
    npm: "ZZMOCK000001",
    email: "mahasiswa.contoh@mail.unpad.ac.id",
    status: "aktif",
  },
  tidakterdaftar: {
    label: "Mahasiswa TIDAK terdaftar (NPM tidak ada di tabel)",
    paus_id: "MOCK-002",
    nama: "Mahasiswa Tidak Terdaftar",
    npm: "ZZMOCK000002",
    email: "tidak.terdaftar@mail.unpad.ac.id",
    status: "aktif",
  },
  alumni: {
    label: "Alumni (status = alumni)",
    paus_id: "MOCK-003",
    nama: "Alumni Contoh",
    npm: "ZZMOCK000003",
    email: "alumni.contoh@mail.unpad.ac.id",
    status: "alumni",
  },
  dosen: {
    label: "Dosen/tendik (hanya NIP, tanpa NPM)",
    paus_id: "MOCK-004",
    nama: "Dosen Contoh",
    nip: "198001012005011001",
    email: "dosen.contoh@unpad.ac.id",
    status: "aktif",
  },
};

function profileFor(user) {
  if (SHAPE === "attributes") {
    const attr = (value) => ({ attribute_value: value });
    return {
      email: user.email,
      attributes: {
        paus_id: attr(user.paus_id),
        nama: attr(user.nama),
        ...(user.npm ? { npm: attr([user.npm]) } : {}),
        ...(user.nip ? { nip: attr(user.nip) } : {}),
        status: attr(user.status),
      },
    };
  }

  if (SHAPE === "accounts") {
    return {
      email: user.email,
      name: user.nama,
      phone: "08123456789",
      accounts: [
        { is_active: false, phone: "08000000000" },
        {
          is_active: true,
          phone: "08123456789",
          paus_id: user.paus_id,
          ...(user.npm ? { npm: user.npm } : {}),
          ...(user.nip ? { nip: user.nip } : {}),
          status: user.status,
        },
      ],
    };
  }

  return {
    paus_id: user.paus_id,
    nama: user.nama,
    ...(user.npm ? { npm: user.npm } : {}),
    ...(user.nip ? { nip: user.nip } : {}),
    email: user.email,
    status: user.status,
  };
}

const codes = new Map(); // code -> { user, redirectUri }
const tokens = new Map(); // access_token -> user
const events = [];

function record(type, detail = {}) {
  events.push({ at: new Date().toISOString(), type, ...detail });
  console.log(`[mock-paus] ${type}`, JSON.stringify(detail));
}

function send(res, status, body, headers = {}) {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": typeof body === "string" ? "text/html; charset=utf-8" : "application/json",
    ...headers,
  });
  res.end(payload);
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

async function readForm(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const q = url.searchParams;

  if (req.method === "GET" && url.pathname === "/oauth/authorize") {
    const redirectUri = q.get("redirect_uri") ?? "";

    if (q.get("client_id") !== CLIENT_ID) {
      record("authorize.rejected", { reason: "client_id salah" });
      return send(res, 400, { error: "invalid_client", message: "client_id tidak dikenal." });
    }
    if (!REDIRECT_URIS.includes(redirectUri)) {
      record("authorize.rejected", { reason: "redirect_uri tidak terdaftar", redirectUri });
      return send(res, 400, { error: "invalid_request", message: "redirect_uri tidak terdaftar." });
    }
    if (q.get("response_type") !== "code" || !q.get("state") || !q.get("scope")) {
      record("authorize.rejected", { reason: "parameter kurang" });
      return send(res, 400, { error: "invalid_request", message: "response_type, scope, dan state wajib." });
    }

    const as = q.get("as");
    if (as && USERS[as]) {
      const code = randomBytes(16).toString("hex");
      codes.set(code, { user: USERS[as], redirectUri });
      record("authorize.ok", { as, scope: q.get("scope") });
      const target = new URL(redirectUri);
      target.searchParams.set("code", code);
      target.searchParams.set("state", q.get("state"));
      return redirect(res, target.toString());
    }

    const links = Object.entries(USERS)
      .map(([key, user]) => {
        const next = new URL(url);
        next.searchParams.set("as", key);
        return `<li><a href="${next.pathname}${next.search.replaceAll("&", "&amp;")}">${user.label}</a></li>`;
      })
      .join("");
    return send(
      res,
      200,
      `<!doctype html><meta charset="utf-8"><title>PAuS tiruan</title><h1>PAuS SSO (tiruan lokal)</h1><p>Pilih akun uji:</p><ul>${links}</ul>`,
    );
  }

  if (req.method === "POST" && url.pathname === "/oauth/token") {
    const form = await readForm(req);
    const code = form.get("code") ?? "";
    const entry = codes.get(code);

    if (form.get("client_id") !== CLIENT_ID || form.get("client_secret") !== CLIENT_SECRET) {
      record("token.rejected", { reason: "client salah" });
      return send(res, 401, { error: "invalid_client", message: "client_id atau client_secret salah." });
    }
    if (form.get("grant_type") !== "authorization_code") {
      record("token.rejected", { reason: "grant_type salah" });
      return send(res, 400, { error: "unsupported_grant_type", message: "grant_type harus authorization_code." });
    }
    if (!entry || form.get("redirect_uri") !== entry.redirectUri) {
      record("token.rejected", { reason: "code tidak valid atau redirect_uri tidak cocok" });
      return send(res, 400, { error: "invalid_grant", message: "code tidak valid atau sudah dipakai." });
    }

    codes.delete(code); // sekali pakai
    const accessToken = randomBytes(24).toString("hex");
    tokens.set(accessToken, entry.user);
    record("token.ok", { accept: req.headers.accept ?? null });
    return send(res, 200, { access_token: accessToken, token_type: "Bearer", expires_in: 3600 });
  }

  if (req.method === "GET" && url.pathname === "/api/user") {
    const header = req.headers.authorization ?? "";
    const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    const token = bearer || (ACCEPT_QUERY ? q.get("access_token") ?? "" : "");
    const user = tokens.get(token);

    if (!user) {
      record("userinfo.rejected", { viaHeader: Boolean(bearer), viaQuery: Boolean(q.get("access_token")) });
      return send(res, 401, { error: "access_denied", message: "Token tidak valid." });
    }

    record("userinfo.ok", { via: bearer ? "header" : "query", shape: SHAPE });
    return send(res, 200, profileFor(user));
  }

  if (req.method === "GET" && url.pathname === "/oauth/sign-out") {
    const param = process.env.MOCK_PAUS_SIGNOUT_PARAM ?? "redirect_uri";
    const target = q.get(param) ?? "";

    if (q.get("client_id") !== CLIENT_ID || !SIGNOUT_REDIRECTS.includes(target)) {
      record("signout.rejected", { target });
      return send(res, 400, { error: "invalid_request", message: "client_id atau tujuan kembali tidak terdaftar." });
    }

    record("signout.ok", { target });
    return redirect(res, target);
  }

  if (req.method === "GET" && url.pathname === "/__log") {
    return send(res, 200, { shape: SHAPE, events });
  }

  if (req.method === "POST" && url.pathname === "/__reset") {
    events.length = 0;
    return send(res, 200, { ok: true });
  }

  send(res, 404, { error: "not_found" });
});

server.listen(PORT, () => {
  console.log(`[mock-paus] siap di http://localhost:${PORT} (bentuk profil: ${SHAPE})`);
  console.log(`[mock-paus] client_id=${CLIENT_ID}`);
  console.log(`[mock-paus] redirect_uri terdaftar: ${REDIRECT_URIS.join(" , ")}`);
  console.log(`[mock-paus] tujuan logout terdaftar: ${SIGNOUT_REDIRECTS.join(" , ")}`);
});
