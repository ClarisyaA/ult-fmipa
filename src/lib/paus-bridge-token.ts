import { createHmac, timingSafeEqual } from "crypto";

import type { AppSessionUser } from "@/lib/auth-user-mapper";

type PausBridgePayload = {
  name?: string;
  npm?: string;
  nip?: string;
  pausId?: string;
  email?: string;
  iat?: number;
  exp?: number;
};

function getBridgeSecret() {
  return process.env.PAUS_BRIDGE_SECRET || "";
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string) {
  return createHmac("sha256", getBridgeSecret())
    .update(payload)
    .digest("base64url");
}

function assertValidPayload(payload: PausBridgePayload) {
  const now = Math.floor(Date.now() / 1000);

  if (!payload.exp || payload.exp < now) {
    throw new Error("Token bridge PAUS sudah kedaluwarsa.");
  }

  if (payload.iat && payload.iat > now + 60) {
    throw new Error("Token bridge PAUS belum valid.");
  }
}

export function verifyPausBridgeToken(token: string) {
  const secret = getBridgeSecret();

  if (!secret || secret === "change-me") {
    throw new Error("PAUS_BRIDGE_SECRET belum dikonfigurasi.");
  }

  const [payloadPart, signaturePart] = token.split(".");

  if (!payloadPart || !signaturePart) {
    throw new Error("Format token bridge PAUS tidak valid.");
  }

  const expectedSignature = signPayload(payloadPart);
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signaturePart);

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    throw new Error("Signature token bridge PAUS tidak valid.");
  }

  const payload = JSON.parse(base64UrlDecode(payloadPart)) as PausBridgePayload;
  assertValidPayload(payload);

  return payload;
}

// PAUS Bridge is a legacy, non-OAuth mechanism (see src/lib/auth.ts) used
// to bridge sessions from an external legacy system. It is student-only,
// the same business rule as the modern PAUS OAuth provider: a session can
// only be created for a payload that carries a non-empty NPM. NIP alone
// must never grant STAFF - Staff/Admin authorization comes exclusively
// from data_users.APP_ROLE via the Credentials provider.
export function mapPausBridgePayloadToSessionUser(
  payload: PausBridgePayload
): AppSessionUser {
  const npm = payload.npm?.trim() || undefined;

  if (!npm) {
    throw new Error(
      "Token bridge PAUS hanya berlaku untuk mahasiswa dengan NPM yang valid."
    );
  }

  const nip = payload.nip?.trim() || undefined;
  const email = payload.email?.trim() || undefined;
  const id = payload.pausId ?? `paus-npm-${npm}`;

  return {
    id,
    name: payload.name?.trim() || "Mahasiswa PAUS",
    email,
    role: "MAHASISWA",
    npm,
    nip,
    pausId: payload.pausId,
  };
}
