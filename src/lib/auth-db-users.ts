import { createHash, timingSafeEqual } from "node:crypto";

import type { AppRole, AppSessionUser } from "@/lib/auth-user-mapper";
import { prisma } from "@/lib/prisma";

const DEFAULT_ADMIN_ACCESS_CODES = ["SUPER_USER"];
const DEFAULT_STAFF_ACCESS_CODES = ["ADMIN", "OPERATOR", "KRS", "PIMPINAN"];

function parseAccessCodes(value: string | undefined, fallback: string[]) {
  if (!value) {
    return fallback;
  }

  const codes = value
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);

  return codes.length > 0 ? codes : fallback;
}

function mapAccessCodeToRole(accessCode: string): AppRole | null {
  const code = accessCode.trim().toUpperCase();
  const adminAccessCodes = parseAccessCodes(
    process.env.DB_ADMIN_ACCESS_CODES,
    DEFAULT_ADMIN_ACCESS_CODES
  );
  const staffAccessCodes = parseAccessCodes(
    process.env.DB_STAFF_ACCESS_CODES,
    DEFAULT_STAFF_ACCESS_CODES
  );

  if (adminAccessCodes.includes(code)) {
    return "admin";
  }

  if (staffAccessCodes.includes(code)) {
    return "staff";
  }

  return null;
}

function timingSafeEqualText(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function verifyLegacyPassword(password: string, passwordHash: string) {
  const storedHash = passwordHash.trim().toLowerCase();

  if (!/^[a-f0-9]{40}$/.test(storedHash)) {
    return false;
  }

  const sha1Password = createHash("sha1")
    .update(password, "utf8")
    .digest("hex");

  return timingSafeEqualText(sha1Password, storedHash);
}

export async function authorizeDbCredentialUser(
  identifier: string,
  password: string
): Promise<AppSessionUser | null> {
  const loginIdentifier = identifier.trim();

  if (!loginIdentifier || !password) {
    return null;
  }

  const user = await prisma.data_users.findFirst({
    where: {
      OR: [{ USER_NAME: loginIdentifier }, { EMAIL: loginIdentifier }],
    },
    select: {
      USER_NAME: true,
      FULL_NAME: true,
      EMAIL: true,
      TELEPHONE: true,
      CONFIRMED: true,
      PASSWORD: true,
      ACCESS_CODE: true,
    },
  });

  if (!user || user.CONFIRMED !== "1") {
    return null;
  }

  const role = mapAccessCodeToRole(user.ACCESS_CODE);

  if (!role || !verifyLegacyPassword(password, user.PASSWORD)) {
    return null;
  }

  return {
    id: `legacy-${user.USER_NAME}`,
    name: user.FULL_NAME,
    email: user.EMAIL,
    role,
    phone: user.TELEPHONE ?? undefined,
  };
}
