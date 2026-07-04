import { prisma } from "@/lib/prisma";
import type { PaginatedResult } from "@/lib/admin-master";

// ---------------------------------------------------------------------------
// Data Level (read-only)
// ---------------------------------------------------------------------------

export type LevelRow = {
  id: number;
  name: string;
  fieldName: string;
};

export async function getLevelList(): Promise<LevelRow[]> {
  const data = await prisma.data_level.findMany({
    orderBy: { LEVEL_DATA_ID: "asc" },
  });

  return data.map((d) => ({
    id: d.LEVEL_DATA_ID,
    name: d.LEVEL_DATA_NAME,
    fieldName: d.FIELD_NAME,
  }));
}

// ---------------------------------------------------------------------------
// Data Unit (read-only)
// ---------------------------------------------------------------------------

export type UnitRow = {
  id: number;
  levelDataId: number;
  levelDataCode: string;
  unitName: string;
};

export async function getUnitList(
  page = 1,
  limit = 20,
  search?: string
): Promise<PaginatedResult<UnitRow>> {
  const skip = (page - 1) * limit;

  const where = search?.trim()
    ? {
        OR: [
          { UNIT_NAME: { contains: search.trim() } },
          { LEVEL_DATA_CODE: { contains: search.trim() } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.data_unit.findMany({
      where,
      orderBy: { UNIT_ID: "asc" },
      skip,
      take: limit,
    }),
    prisma.data_unit.count({ where }),
  ]);

  return {
    data: data.map((d) => ({
      id: Number(d.UNIT_ID),
      levelDataId: d.LEVEL_DATA_ID,
      levelDataCode: d.LEVEL_DATA_CODE,
      unitName: d.UNIT_NAME,
    })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

// ---------------------------------------------------------------------------
// Data Users (read-only, PASSWORD excluded)
// ---------------------------------------------------------------------------

export type UserRow = {
  userName: string;
  fullName: string;
  email: string;
  telephone: string | null;
  confirmed: string;
  unitId: number;
  accessCode: string;
};

export async function getUserList(
  page = 1,
  limit = 20,
  search?: string
): Promise<PaginatedResult<UserRow>> {
  const skip = (page - 1) * limit;

  const where = search?.trim()
    ? {
        OR: [
          { USER_NAME: { contains: search.trim() } },
          { FULL_NAME: { contains: search.trim() } },
          { EMAIL: { contains: search.trim() } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.data_users.findMany({
      where,
      select: {
        USER_NAME: true,
        FULL_NAME: true,
        EMAIL: true,
        TELEPHONE: true,
        CONFIRMED: true,
        UNIT_ID: true,
        ACCESS_CODE: true,
      },
      orderBy: { USER_NAME: "asc" },
      skip,
      take: limit,
    }),
    prisma.data_users.count({ where }),
  ]);

  return {
    data: data.map((d) => ({
      userName: d.USER_NAME,
      fullName: d.FULL_NAME,
      email: d.EMAIL,
      telephone: d.TELEPHONE,
      confirmed: d.CONFIRMED,
      unitId: d.UNIT_ID,
      accessCode: d.ACCESS_CODE,
    })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

// ---------------------------------------------------------------------------
// User Log (read-only)
// ---------------------------------------------------------------------------

export type UserLogRow = {
  id: number;
  userName: string;
  time: string;
  ip: string;
  browser: string;
  log: string;
};

export async function getUserLogList(
  page = 1,
  limit = 30,
  search?: string
): Promise<PaginatedResult<UserLogRow>> {
  const skip = (page - 1) * limit;

  const where = search?.trim()
    ? {
        OR: [
          { USER_NAME: { contains: search.trim() } },
          { LOG: { contains: search.trim() } },
          { IP: { contains: search.trim() } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.log_users.findMany({
      where,
      orderBy: { TIME: "desc" },
      skip,
      take: limit,
    }),
    prisma.log_users.count({ where }),
  ]);

  return {
    data: data.map((d) => ({
      id: Number(d.ID),
      userName: d.USER_NAME,
      time: d.TIME.toISOString(),
      ip: d.IP,
      browser: d.BROWSER,
      log: d.LOG,
    })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
