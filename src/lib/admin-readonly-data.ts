import { prisma } from "@/lib/prisma";
import { STAFF_APP_ROLE_LABELS, STAFF_APP_ROLES } from "@/lib/roles";

const DEFAULT_LIMIT = 20;
const MAX_PAGE_SIZE = 100;

function cleanSearch(search?: string) {
  return search?.trim().slice(0, 80) || "";
}

function safeTake(limit?: number) {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(limit, 1), 50);
}

export function safePage(value?: number) {
  if (!value || Number.isNaN(value)) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
}

function safePageSize(value?: number) {
  if (!value || Number.isNaN(value)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(Math.floor(value), 1), MAX_PAGE_SIZE);
}

export function getPaginationMeta({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safeCurrentPage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const end = Math.min(safeCurrentPage * pageSize, total);

  return {
    page: safeCurrentPage,
    pageSize,
    total,
    totalPages,
    start,
    end,
    hasPreviousPage: safeCurrentPage > 1,
    hasNextPage: safeCurrentPage < totalPages,
  };
}

function serializeDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

export async function getMahasiswaRows({
  search,
  limit,
}: {
  search?: string;
  limit?: number;
}) {
  const query = cleanSearch(search);
  const rows = await prisma.mahasiswa.findMany({
    where: query
      ? {
          OR: [
            { NPM: { contains: query } },
            { NAMA: { contains: query } },
            { PROGRAM_STUDI: { contains: query } },
          ],
        }
      : undefined,
    select: {
      NPM: true,
      NAMA: true,
      KD_PS: true,
      KD_PA: true,
      PROGRAM_STUDI: true,
      ANGKATAN: true,
      JENJANG: true,
      FAK: true,
    },
    orderBy: { NPM: "asc" },
    take: safeTake(limit),
  });

  return rows.map((row) => ({
    npm: row.NPM,
    nama: row.NAMA,
    kdPs: row.KD_PS,
    kdPa: row.KD_PA,
    programStudi: row.PROGRAM_STUDI,
    angkatan: row.ANGKATAN,
    status: row.JENJANG,
    fak: row.FAK,
  }));
}

export async function getMahasiswaPage({
  search,
  page,
  pageSize,
}: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const query = cleanSearch(search);
  const currentPage = safePage(page);
  const take = safePageSize(pageSize);
  const numericQuery = Number(query);
  const numericSearch = Number.isFinite(numericQuery) ? numericQuery : null;
  const where = query
    ? {
        OR: [
          { NPM: { contains: query } },
          { NAMA: { contains: query } },
          { PROGRAM_STUDI: { contains: query } },
          { JENJANG: { contains: query } },
          ...(numericSearch !== null ? [{ ANGKATAN: numericSearch }] : []),
        ],
      }
    : undefined;

  const total = await prisma.mahasiswa.count({ where });
  const pagination = getPaginationMeta({
    page: currentPage,
    pageSize: take,
    total,
  });
  const rows = await prisma.mahasiswa.findMany({
      where,
      select: {
        NPM: true,
        NAMA: true,
        KD_PS: true,
        KD_PA: true,
        PROGRAM_STUDI: true,
        ANGKATAN: true,
        JENJANG: true,
        FAK: true,
      },
      orderBy: { NPM: "asc" },
      skip: (pagination.page - 1) * take,
      take,
  });

  return {
    rows: rows.map((row) => ({
      npm: row.NPM,
      nama: row.NAMA,
      kdPs: row.KD_PS,
      kdPa: row.KD_PA,
      programStudi: row.PROGRAM_STUDI,
      angkatan: row.ANGKATAN,
      status: row.JENJANG,
      fak: row.FAK,
    })),
    pagination,
  };
}

export async function getTracerStudyRows({
  search,
  limit,
}: {
  search?: string;
  limit?: number;
}) {
  const query = cleanSearch(search);
  const rows = await prisma.alumni.findMany({
    where: query
      ? {
          OR: [
            { npm: { contains: query } },
            { nama: { contains: query } },
            { prodi: { contains: query } },
            { program: { contains: query } },
            { instansi: { contains: query } },
          ],
        }
      : undefined,
    select: {
      id: true,
      npm: true,
      nama: true,
      program: true,
      prodi: true,
      tahun_masuk: true,
      tahun_lulus: true,
      instansi: true,
      Jabatan: true,
      status_isi: true,
    },
    orderBy: { id: "desc" },
    take: safeTake(limit),
  });

  return rows.map((row) => ({
    id: row.id,
    npm: row.npm,
    nama: row.nama,
    programStudi: [row.program, row.prodi].filter(Boolean).join(" ") || null,
    program: row.program,
    prodi: row.prodi,
    tahunMasuk: row.tahun_masuk,
    tahunLulus: row.tahun_lulus,
    instansi: row.instansi,
    jabatan: row.Jabatan,
    statusIsi: row.status_isi,
  }));
}

export async function getTracerStudyPage({
  search,
  page,
  pageSize,
}: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const query = cleanSearch(search);
  const currentPage = safePage(page);
  const take = safePageSize(pageSize);
  const numericQuery = Number(query);
  const numericSearch = Number.isFinite(numericQuery) ? numericQuery : null;
  const where = query
    ? {
        OR: [
          { npm: { contains: query } },
          { nama: { contains: query } },
          { prodi: { contains: query } },
          { program: { contains: query } },
          { instansi: { contains: query } },
          { Jabatan: { contains: query } },
          ...(numericSearch !== null ? [{ tahun_lulus: numericSearch }] : []),
        ],
      }
    : undefined;

  const total = await prisma.alumni.count({ where });
  const pagination = getPaginationMeta({
    page: currentPage,
    pageSize: take,
    total,
  });
  const rows = await prisma.alumni.findMany({
      where,
      select: {
        id: true,
        npm: true,
        nama: true,
        program: true,
        prodi: true,
        tahun_masuk: true,
        tahun_lulus: true,
        instansi: true,
        Jabatan: true,
        status_isi: true,
      },
      orderBy: { id: "desc" },
      skip: (pagination.page - 1) * take,
      take,
  });

  return {
    rows: rows.map((row) => ({
      id: row.id,
      npm: row.npm,
      nama: row.nama,
      programStudi: [row.program, row.prodi].filter(Boolean).join(" ") || null,
      program: row.program,
      prodi: row.prodi,
      tahunMasuk: row.tahun_masuk,
      tahunLulus: row.tahun_lulus,
      instansi: row.instansi,
      jabatan: row.Jabatan,
      statusIsi: row.status_isi,
    })),
    pagination,
  };
}

export async function getLevelRows({
  search,
  limit,
}: {
  search?: string;
  limit?: number;
}) {
  const query = cleanSearch(search);

  return prisma.data_level.findMany({
    where: query
      ? {
          OR: [
            { LEVEL_DATA_NAME: { contains: query } },
            { FIELD_NAME: { contains: query } },
          ],
        }
      : undefined,
    select: {
      LEVEL_DATA_ID: true,
      LEVEL_DATA_NAME: true,
      FIELD_NAME: true,
    },
    orderBy: { LEVEL_DATA_ID: "asc" },
    take: safeTake(limit),
  });
}

export async function getUnitRows({
  search,
  limit,
}: {
  search?: string;
  limit?: number;
}) {
  const query = cleanSearch(search);
  const rows = await prisma.data_unit.findMany({
    where: query
      ? {
          OR: [
            { UNIT_NAME: { contains: query } },
            { LEVEL_DATA_CODE: { contains: query } },
          ],
        }
      : undefined,
    select: {
      UNIT_ID: true,
      LEVEL_DATA_ID: true,
      LEVEL_DATA_CODE: true,
      UNIT_NAME: true,
    },
    orderBy: { UNIT_NAME: "asc" },
    take: safeTake(limit),
  });

  return rows.map((row) => ({
    unitId: row.UNIT_ID.toString(),
    levelDataId: row.LEVEL_DATA_ID,
    levelDataCode: row.LEVEL_DATA_CODE,
    unitName: row.UNIT_NAME,
  }));
}

export const USER_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const USER_DEFAULT_PAGE_SIZE = DEFAULT_LIMIT;

export function sanitizeUserPageSize(value?: number) {
  if (
    value &&
    (USER_PAGE_SIZE_OPTIONS as readonly number[]).includes(value)
  ) {
    return value;
  }

  return DEFAULT_LIMIT;
}

export async function getUserPage({
  search,
  page,
  pageSize,
}: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const query = cleanSearch(search);
  const currentPage = safePage(page);
  const take = sanitizeUserPageSize(pageSize);
  const where = query
    ? {
        OR: [
          { USER_NAME: { contains: query } },
          { FULL_NAME: { contains: query } },
          { EMAIL: { contains: query } },
          { ACCESS_CODE: { contains: query } },
        ],
      }
    : undefined;

  const total = await prisma.data_users.count({ where });
  const pagination = getPaginationMeta({
    page: currentPage,
    pageSize: take,
    total,
  });
  const rows = await prisma.data_users.findMany({
    where,
    select: {
      USER_NAME: true,
      FULL_NAME: true,
      EMAIL: true,
      TELEPHONE: true,
      CONFIRMED: true,
      ACCESS_CODE: true,
      APP_ROLE: true,
      UNIT_ID: true,
    },
    // USER_NAME is data_users' primary key, so a single ascending sort is
    // already fully deterministic - no secondary sort key is needed for
    // stable pagination across pages.
    orderBy: { USER_NAME: "asc" },
    skip: (pagination.page - 1) * take,
    take,
  });

  return { rows, pagination };
}

export async function getUnitOptions() {
  const rows = await prisma.data_unit.findMany({
    select: {
      UNIT_ID: true,
      UNIT_NAME: true,
    },
    orderBy: { UNIT_NAME: "asc" },
    take: 200,
  });

  return rows.map((row) => ({
    unitId: row.UNIT_ID.toString(),
    unitName: row.UNIT_NAME,
  }));
}

export async function getLevelOptions() {
  return prisma.data_level.findMany({
    select: {
      LEVEL_DATA_ID: true,
      LEVEL_DATA_NAME: true,
    },
    orderBy: { LEVEL_DATA_ID: "asc" },
    take: 100,
  });
}

export async function getUserLogRows({
  search,
  limit,
}: {
  search?: string;
  limit?: number;
}) {
  const query = cleanSearch(search);
  const rows = await prisma.log_users.findMany({
    where: query
      ? {
          OR: [{ USER_NAME: { contains: query } }, { LOG: { contains: query } }],
        }
      : undefined,
    select: {
      ID: true,
      USER_NAME: true,
      TIME: true,
      LOG: true,
    },
    orderBy: { TIME: "desc" },
    take: safeTake(limit),
  });

  return rows.map((row) => ({
    id: row.ID.toString(),
    userName: row.USER_NAME,
    time: serializeDate(row.TIME),
    log: row.LOG,
  }));
}

export async function getAccessRows({
  search,
  limit,
}: {
  search?: string;
  limit?: number;
}) {
  const query = cleanSearch(search);

  return prisma.data_access.findMany({
    where: query
      ? {
          OR: [
            { ACCESS_CODE: { contains: query } },
            { DESCRIPTION: { contains: query } },
          ],
        }
      : undefined,
    select: {
      ACCESS_CODE: true,
      DESCRIPTION: true,
    },
    orderBy: { ACCESS_CODE: "asc" },
    take: safeTake(limit),
  });
}

export function getAppRoleRows() {
  return STAFF_APP_ROLES.map((role) => ({
    APP_ROLE: role,
    DESCRIPTION: STAFF_APP_ROLE_LABELS[role],
  }));
}
