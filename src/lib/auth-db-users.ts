import { createHash, timingSafeEqual } from "node:crypto";

import type { AppRole, AppSessionUser } from "@/lib/auth-user-mapper";
import { prisma } from "@/lib/prisma";
import { resolveAppRole } from "@/lib/roles";

export function mapAccessCodeToRole(accessCode: string): AppRole | null {
  return resolveAppRole({ positionCode: accessCode });
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

export function hashLegacyPassword(password: string) {
  // Keep using the existing legacy SHA-1 storage convention so DB users remain
  // compatible with the current login flow.
  return createHash("sha1").update(password, "utf8").digest("hex");
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
      APP_ROLE: true,
    },
  });

  if (!user || user.CONFIRMED !== "1") {
    return null;
  }

  const role = resolveAppRole({
    appRole: user.APP_ROLE,
    positionCode: user.ACCESS_CODE,
  });

  if (!role || !verifyLegacyPassword(password, user.PASSWORD)) {
    return null;
  }

  return {
    id: `legacy-${user.USER_NAME}`,
    name: user.FULL_NAME,
    email: user.EMAIL,
    role,
    positionCode: user.ACCESS_CODE,
    accessCode: user.ACCESS_CODE,
    phone: user.TELEPHONE ?? undefined,
  };
}
