import { prisma } from "@/lib/prisma";
import {
  AdminActionError,
  cleanString,
  handleAdminApiError,
  nullableString,
  parseJsonBody,
  parseOptionalInt,
  requireAdminApi,
  successJson,
  validationError,
} from "@/lib/admin-master-api";

function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AdminActionError("ID tracer study tidak valid.");
  }
  return id;
}

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
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { id: idParam } = await params;
    const id = parseId(idParam);
    const body = await parseJsonBody(request);
    const data = parseTracerBody(body);
    const exists = await prisma.alumni.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      return validationError("Data tracer study tidak ditemukan.", 404);
    }

    const row = await prisma.alumni.update({
      where: { id },
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

    return successJson(row, "Data tracer study berhasil diperbarui.");
  } catch (error) {
    return handleAdminApiError(
      error,
      "api:admin:alumni:tracer-study:update",
      "Data tracer study gagal diperbarui.",
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { id: idParam } = await params;
    const id = parseId(idParam);

    await prisma.alumni.delete({ where: { id } });

    return successJson({ id }, "Data tracer study berhasil dihapus.");
  } catch (error) {
    return handleAdminApiError(
      error,
      "api:admin:alumni:tracer-study:delete",
      "Data tracer study gagal dihapus.",
    );
  }
}
