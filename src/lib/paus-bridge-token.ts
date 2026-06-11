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

export function mapPausBridgePayloadToSessionUser(
  payload: PausBridgePayload
): AppSessionUser {
  const npm = payload.npm?.trim() || undefined;
  const nip = payload.nip?.trim() || undefined;

  if (!npm && !nip) {
    throw new Error("Token bridge PAUS tidak memuat NPM atau NIP.");
  }

  const id = payload.pausId ?? npm ?? nip;

  if (!id) {
    throw new Error("Token bridge PAUS tidak memuat identifier.");
  }

  return {
    id,
    name: payload.name?.trim() || "Pengguna PAUS",
    email: payload.email,
    role: npm ? "student" : "staff",
    npm,
    nip,
    pausId: payload.pausId,
  };
}
