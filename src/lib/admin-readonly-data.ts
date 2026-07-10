import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 20;

function cleanSearch(search?: string) {
  return search?.trim().slice(0, 80) || "";
}

function safeTake(limit?: number) {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(limit, 1), 50);
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
      PROGRAM_STUDI: true,
      ANGKATAN: true,
      JENJANG: true,
    },
    orderBy: { NPM: "asc" },
    take: safeTake(limit),
  });

  return rows.map((row) => ({
    npm: row.NPM,
    nama: row.NAMA,
    programStudi: row.PROGRAM_STUDI,
    angkatan: row.ANGKATAN,
    status: row.JENJANG,
  }));
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
    tahunLulus: row.tahun_lulus,
    instansi: row.instansi,
    jabatan: row.Jabatan,
    statusIsi: row.status_isi,
  }));
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

export async function getUserRows({
  search,
  limit,
}: {
  search?: string;
  limit?: number;
}) {
  const query = cleanSearch(search);

  return prisma.data_users.findMany({
    where: query
      ? {
          OR: [
            { USER_NAME: { contains: query } },
            { FULL_NAME: { contains: query } },
            { EMAIL: { contains: query } },
            { ACCESS_CODE: { contains: query } },
          ],
        }
      : undefined,
    select: {
      USER_NAME: true,
      FULL_NAME: true,
      EMAIL: true,
      CONFIRMED: true,
      ACCESS_CODE: true,
      UNIT_ID: true,
    },
    orderBy: { USER_NAME: "asc" },
    take: safeTake(limit),
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
