import type { Session } from "next-auth";

import {
  handleAdminApiError,
  successJson,
  validationError,
} from "@/lib/admin-master-api";
import {
  MAX_IMPORT_FILE_BYTES,
  parseMahasiswaImportFile,
} from "@/lib/mahasiswa-import-file";
import { MahasiswaSyncError } from "@/lib/mahasiswa-sync-core";
import { runMahasiswaSync } from "@/lib/mahasiswa-sync";

// Overhead multipart di atas ukuran file.
const MULTIPART_OVERHEAD_BYTES = 256 * 1024;

/**
 * Dipakai bersama oleh API Admin dan API Staff (yang sudah diberi akses).
 * Pemanggil wajib sudah memeriksa hak akses sebelum memanggil fungsi ini.
 *
 * Form: `file` (.xlsx/.csv) dan `mode` ("preview" | "apply").
 * Mode "preview" tidak mengubah data apa pun.
 */
export async function handleMahasiswaImportRequest(
  request: Request,
  actor: Session["user"],
  context: string,
) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_IMPORT_FILE_BYTES + MULTIPART_OVERHEAD_BYTES) {
      return validationError(
        `Ukuran file melebihi ${MAX_IMPORT_FILE_BYTES / (1024 * 1024)} MB.`,
        413,
      );
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return validationError("Permintaan harus berupa unggahan file.");
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      return validationError("File belum dipilih.");
    }

    const mode = form.get("mode") === "apply" ? "apply" : "preview";
    const buffer = Buffer.from(await file.arrayBuffer());
    const { records, usedLegacyOrder } = await parseMahasiswaImportFile({
      name: file.name,
      size: file.size,
      buffer,
    });

    const summary = await runMahasiswaSync({
      records,
      mode,
      source: "excel",
      actor,
      request,
    });

    return successJson(
      { ...summary, usedLegacyOrder },
      mode === "apply"
        ? "Data mahasiswa berhasil disinkronkan."
        : "Pemeriksaan file selesai. Belum ada data yang disimpan.",
    );
  } catch (error) {
    if (error instanceof MahasiswaSyncError) {
      return validationError(error.message, error.statusCode);
    }

    return handleAdminApiError(error, context, "File gagal diproses.");
  }
}
