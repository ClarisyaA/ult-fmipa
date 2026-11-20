import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

import { getCurrentUser } from "@/lib/auth";
import {
  dbUserNameFromSessionUserId,
  isStaffFeatureKey,
  type StaffFeatureKey,
} from "@/lib/feature-access-core";
import { logServerError } from "@/lib/error-utils";
import { prisma } from "@/lib/prisma";
import { isRole } from "@/lib/roles";

type SessionUser = Pick<Session["user"], "id" | "role">;

/**
 * Admin selalu boleh. Staff hanya jika sudah diberi akses oleh Admin.
 * Gagal tertutup: bila tabel/DB bermasalah, staff dianggap tidak punya akses.
 */
export async function hasStaffFeatureAccess(
  user: SessionUser | null | undefined,
  feature: StaffFeatureKey,
): Promise<boolean> {
  if (!user) return false;
  if (isRole(user.role, "ADMIN")) return true;
  if (!isRole(user.role, "STAFF")) return false;

  const userName = dbUserNameFromSessionUserId(user.id);
  if (!userName) return false;

  try {
    const rows = await prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT COUNT(*) AS total
      FROM ult_staff_feature_access
      WHERE USER_NAME = ${userName} AND FEATURE = ${feature}
    `;

    return Number(rows[0]?.total ?? 0) > 0;
  } catch (error) {
    logServerError("feature-access:check", error);
    return false;
  }
}

export async function getFeatureGrants(userNames: string[]) {
  const grants = new Map<string, StaffFeatureKey[]>();
  if (userNames.length === 0) return grants;

  const rows = await prisma.$queryRaw<Array<{ USER_NAME: string; FEATURE: string }>>(
    Prisma.sql`
      SELECT USER_NAME, FEATURE
      FROM ult_staff_feature_access
      WHERE USER_NAME IN (${Prisma.join(userNames)})
    `,
  );

  for (const row of rows) {
    if (!isStaffFeatureKey(row.FEATURE)) continue;
    const list = grants.get(row.USER_NAME) ?? [];
    list.push(row.FEATURE);
    grants.set(row.USER_NAME, list);
  }

  return grants;
}

export async function setFeatureGrant({
  userName,
  feature,
  granted,
  grantedBy,
}: {
  userName: string;
  feature: StaffFeatureKey;
  granted: boolean;
  grantedBy: string;
}) {
  if (granted) {
    await prisma.$executeRaw`
      INSERT IGNORE INTO ult_staff_feature_access (USER_NAME, FEATURE, GRANTED_BY)
      VALUES (${userName}, ${feature}, ${grantedBy.slice(0, 20)})
    `;
    return;
  }

  await prisma.$executeRaw`
    DELETE FROM ult_staff_feature_access
    WHERE USER_NAME = ${userName} AND FEATURE = ${feature}
  `;
}

export type FeatureApiResult =
  | { ok: true; user: Session["user"] }
  | { ok: false; response: NextResponse };

/** Untuk API: Admin atau Staff yang sudah diberi akses fitur tersebut. */
export async function requireFeatureApi(
  feature: StaffFeatureKey,
): Promise<FeatureApiResult> {
  const user = await getCurrentUser();

  if (!user || !(await hasStaffFeatureAccess(user, feature))) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Anda tidak memiliki akses ke fitur ini.",
          },
        },
        { status: 403 },
      ),
    };
  }

  return { ok: true, user };
}
