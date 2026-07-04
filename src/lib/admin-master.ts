import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Mahasiswa listing (read-only)
// ---------------------------------------------------------------------------

export type MahasiswaRow = {
  npm: string;
  nama: string | null;
  programStudi: string | null;
  jenjang: string | null;
  angkatan: number | null;
};

export type PaginatedResult<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function getMahasiswaList(
  page = 1,
  limit = 20,
  search?: string
): Promise<PaginatedResult<MahasiswaRow>> {
  const skip = (page - 1) * limit;

  const where = search?.trim()
    ? {
        OR: [
          { NPM: { contains: search.trim() } },
          { NAMA: { contains: search.trim() } },
          { PROGRAM_STUDI: { contains: search.trim() } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.mahasiswa.findMany({
      where,
      select: {
        NPM: true,
        NAMA: true,
        PROGRAM_STUDI: true,
        JENJANG: true,
        ANGKATAN: true,
      },
      orderBy: { NPM: "asc" },
      skip,
      take: limit,
    }),
    prisma.mahasiswa.count({ where }),
  ]);

  return {
    data: data.map((d) => ({
      npm: d.NPM,
      nama: d.NAMA,
      programStudi: d.PROGRAM_STUDI,
      jenjang: d.JENJANG,
      angkatan: d.ANGKATAN,
    })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

// ---------------------------------------------------------------------------
// Alumni / Tracer Study listing (read-only)
// ---------------------------------------------------------------------------

export type AlumniTracerRow = {
  id: number;
  nama: string;
  npm: string | null;
  prodi: string | null;
  tahunMasuk: number | null;
  tahunLulus: number | null;
  instansi: string | null;
  jabatan: string | null;
};

export async function getAlumniTracerList(
  page = 1,
  limit = 20,
  search?: string
): Promise<PaginatedResult<AlumniTracerRow>> {
  const skip = (page - 1) * limit;

  const where = search?.trim()
    ? {
        OR: [
          { nama: { contains: search.trim() } },
          { npm: { contains: search.trim() } },
          { prodi: { contains: search.trim() } },
          { instansi: { contains: search.trim() } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.alumni.findMany({
      where,
      select: {
        id: true,
        nama: true,
        npm: true,
        prodi: true,
        tahun_masuk: true,
        tahun_lulus: true,
        instansi: true,
        Jabatan: true,
      },
      orderBy: { id: "desc" },
      skip,
      take: limit,
    }),
    prisma.alumni.count({ where }),
  ]);

  return {
    data: data.map((d) => ({
      id: d.id,
      nama: d.nama,
      npm: d.npm,
      prodi: d.prodi,
      tahunMasuk: d.tahun_masuk,
      tahunLulus: d.tahun_lulus,
      instansi: d.instansi,
      jabatan: d.Jabatan,
    })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
