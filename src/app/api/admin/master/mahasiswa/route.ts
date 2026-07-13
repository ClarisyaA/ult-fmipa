import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import {
  AdminActionError,
  cleanString,
  handleAdminApiError,
  parseJsonBody,
  parseOptionalInt,
  requireAdminApi,
  successJson,
} from "@/lib/admin-master-api";

function normalizeNpm(value: unknown) {
  const npm = cleanString(value, 15);
  if (!npm) {
    throw new AdminActionError("NPM wajib diisi.");
  }
  return npm;
}

function parseMahasiswaBody(body: Record<string, unknown>) {
  const npm = normalizeNpm(body.npm);
  const nama = cleanString(body.nama, 100);

  if (!nama) {
    throw new AdminActionError("Nama mahasiswa wajib diisi.");
  }

  return {
    NPM: npm,
    NAMA: nama,
    KD_PS: cleanString(body.kdPs, 10) || null,
    KD_PA: cleanString(body.kdPa, 10) || null,
    PROGRAM_STUDI: cleanString(body.programStudi, 150) || null,
    JENJANG: cleanString(body.jenjang, 15) || null,
    ANGKATAN: parseOptionalInt(body.angkatan),
    FAK: cleanString(body.fak, 5) || null,
  };
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const body = await parseJsonBody(request);
    const data = parseMahasiswaBody(body);
    const existing = await prisma.mahasiswa.findUnique({
      where: { NPM: data.NPM },
      select: { NPM: true },
    });

    if (existing) {
      throw new AdminActionError("NPM sudah terdaftar.");
    }

    const row = await prisma.mahasiswa.create({
      data,
      select: {
        NPM: true,
        NAMA: true,
        PROGRAM_STUDI: true,
        JENJANG: true,
        ANGKATAN: true,
      },
    });
    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Mahasiswa: Membuat data mahasiswa NPM: ${row.NPM}`,
    });

    return successJson(row, "Data mahasiswa berhasil ditambahkan.", 201);
  } catch (error) {
    return handleAdminApiError(
      error,
      "api:admin:master:mahasiswa:create",
      "Data mahasiswa gagal ditambahkan.",
    );
  }
}
