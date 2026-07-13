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
  validationError,
} from "@/lib/admin-master-api";

function normalizeNpm(value: unknown) {
  const npm = cleanString(value, 15);
  if (!npm) {
    throw new AdminActionError("NPM tidak valid.");
  }
  return npm;
}

function parseMahasiswaUpdateBody(body: Record<string, unknown>) {
  const nama = cleanString(body.nama, 100);

  if (!nama) {
    throw new AdminActionError("Nama mahasiswa wajib diisi.");
  }

  return {
    NAMA: nama,
    KD_PS: cleanString(body.kdPs, 10) || null,
    KD_PA: cleanString(body.kdPa, 10) || null,
    PROGRAM_STUDI: cleanString(body.programStudi, 150) || null,
    JENJANG: cleanString(body.jenjang, 15) || null,
    ANGKATAN: parseOptionalInt(body.angkatan),
    FAK: cleanString(body.fak, 5) || null,
  };
}

async function countStudentRequests(npm: string) {
  const [
    beasiswa,
    bebasPinjaman,
    ijazah,
    kelakuanBaik,
    keteranganLulus,
    kks,
    kpa,
    legalisir,
    masihKuliah,
    masihKuliahAktif,
    permohonanMagang,
    plagiarisme,
    referensi,
    suratIzinKegiatan,
    suratLain,
    suratPengantar,
    transkrip,
    unggahKaryaIlmiah,
  ] = await Promise.all([
    prisma.beasiswa.count({ where: { NPM: npm } }),
    prisma.bebas_pinjaman.count({ where: { NPM: npm } }),
    prisma.ijazah.count({ where: { NPM: npm } }),
    prisma.kelakuan_baik.count({ where: { NPM: npm } }),
    prisma.keterangan_lulus.count({ where: { NPM: npm } }),
    prisma.kks.count({ where: { NPM: npm } }),
    prisma.kpa.count({ where: { NPM: npm } }),
    prisma.legalisir.count({ where: { NPM: npm } }),
    prisma.masih_kuliah.count({ where: { NPM: npm } }),
    prisma.masih_kuliah_aktif.count({ where: { NPM: npm } }),
    prisma.permohonan_magang.count({ where: { NPM: npm } }),
    prisma.plagiarisme.count({ where: { NPM: npm } }),
    prisma.referensi.count({ where: { NPM: npm } }),
    prisma.surat_izin_kegiatan.count({ where: { NPM: npm } }),
    prisma.surat_lain.count({ where: { NPM: npm } }),
    prisma.surat_pengantar.count({ where: { NPM: npm } }),
    prisma.transkrip.count({ where: { NPM: npm } }),
    prisma.unggah_karya_ilmiah.count({ where: { NPM: npm } }),
  ]);

  return [
    beasiswa,
    bebasPinjaman,
    ijazah,
    kelakuanBaik,
    keteranganLulus,
    kks,
    kpa,
    legalisir,
    masihKuliah,
    masihKuliahAktif,
    permohonanMagang,
    plagiarisme,
    referensi,
    suratIzinKegiatan,
    suratLain,
    suratPengantar,
    transkrip,
    unggahKaryaIlmiah,
  ].reduce((total, count) => total + count, 0);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ npm: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { npm: npmParam } = await params;
    const npm = normalizeNpm(decodeURIComponent(npmParam));
    const body = await parseJsonBody(request);
    const data = parseMahasiswaUpdateBody(body);
    const exists = await prisma.mahasiswa.findUnique({
      where: { NPM: npm },
      select: { NPM: true },
    });

    if (!exists) {
      return validationError("Data mahasiswa tidak ditemukan.", 404);
    }

    const row = await prisma.mahasiswa.update({
      where: { NPM: npm },
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
      action: `Mahasiswa: Mengubah data mahasiswa NPM: ${row.NPM}`,
    });

    return successJson(row, "Data mahasiswa berhasil diperbarui.");
  } catch (error) {
    return handleAdminApiError(
      error,
      "api:admin:master:mahasiswa:update",
      "Data mahasiswa gagal diperbarui.",
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ npm: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { npm: npmParam } = await params;
    const npm = normalizeNpm(decodeURIComponent(npmParam));
    const body = await request.json().catch(() => ({}));
    const exists = await prisma.mahasiswa.findUnique({
      where: { NPM: npm },
      select: { NPM: true },
    });

    if (!exists) {
      return validationError("Data mahasiswa tidak ditemukan.", 404);
    }

    const requestCount = await countStudentRequests(npm);

    if (requestCount > 0 && body?.forceDelete !== true) {
      throw new AdminActionError(
        `Mahasiswa ini punya ${requestCount} pengajuan layanan. Ulangi hapus dengan konfirmasi kuat jika tetap ingin menghapus data master.`,
        400,
        "REFERENCED_RECORD",
      );
    }

    await prisma.mahasiswa.delete({ where: { NPM: npm } });
    await writeAuditLog({
      actor: auth.user,
      request,
      action: `Mahasiswa: Menghapus data mahasiswa NPM: ${npm}`,
    });

    return successJson({ npm }, "Data mahasiswa berhasil dihapus.");
  } catch (error) {
    return handleAdminApiError(
      error,
      "api:admin:master:mahasiswa:delete",
      "Data mahasiswa gagal dihapus.",
    );
  }
}
