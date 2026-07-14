import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import {
  AdminActionError,
  cleanString,
  handleAdminApiError,
  nullableString,
  parseJsonBody,
  parseOptionalInt,
  requireAdminApi,
  successJson,
} from "@/lib/admin-master-api";

function parseTracerBody(body: Record<string, unknown>) {
  const nama = cleanString(body.nama, 50);

  if (!nama) {
    throw new AdminActionError("Nama alumni wajib diisi.");
  }

  return {
    nama,
    npm: nullableString(body.npm, 15),
    program: nullableString(body.program, 30),
    prodi: nullableString(body.prodi, 45),
    tahun_masuk: parseOptionalInt(body.tahunMasuk),
    tahun_lulus: parseOptionalInt(body.tahunLulus),
    instansi: nullableString(body.instansi, 30),
    Jabatan: nullableString(body.jabatan, 25),
    status_isi: body.statusIsi === true || body.statusIsi === "1" ? 1 : 0,
    tgl_entri: new Date(),
  };
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const body = await parseJsonBody(request);
    const data = parseTracerBody(body);
    const row = await prisma.alumni.create({
      data,
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
    });
    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Tracer Study: Membuat data tracer alumni: ${row.id}`,
    });

    return successJson(row, "Data tracer study berhasil ditambahkan.", 201);
  } catch (error) {
    return handleAdminApiError(
      error,
      "api:admin:alumni:tracer-study:create",
      "Data tracer study gagal ditambahkan.",
    );
  }
}
