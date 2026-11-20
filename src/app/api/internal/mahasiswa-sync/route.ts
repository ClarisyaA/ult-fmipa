import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { handleAdminApiError, successJson } from "@/lib/admin-master-api";
import {
  MAX_IMPORT_ROWS,
  MahasiswaSyncError,
  recordsFromObjects,
} from "@/lib/mahasiswa-sync-core";
import { runMahasiswaSync } from "@/lib/mahasiswa-sync";

export const runtime = "nodejs";

const MIN_TOKEN_LENGTH = 32;
const MAX_BODY_BYTES = 10 * 1024 * 1024;

function jsonError(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status },
  );
}

function tokenMatches(provided: string, expected: string) {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();

  return timingSafeEqual(a, b);
}

/**
 * Pintu sinkron otomatis: sistem lain mengirim data mahasiswa (push).
 *
 * Nonaktif selama MAHASISWA_SYNC_TOKEN belum diisi (balasan 404).
 * Header: Authorization: Bearer <MAHASISWA_SYNC_TOKEN>
 * Body JSON: { "rows": [{ "npm", "nama", "kodeProdi", "namaProdi",
 *                         "jenjang", "angkatan" }], "dryRun": false }
 * Memakai inti yang sama dengan unggah Excel (upsert per NPM, tanpa hapus).
 */
export async function POST(request: Request) {
  const expected = process.env.MAHASISWA_SYNC_TOKEN?.trim();

  if (!expected) {
    return jsonError("NOT_FOUND", "Tidak ditemukan.", 404);
  }

  if (expected.length < MIN_TOKEN_LENGTH) {
    console.error(
      `[api:internal:mahasiswa-sync] MAHASISWA_SYNC_TOKEN kurang dari ${MIN_TOKEN_LENGTH} karakter; endpoint dinonaktifkan.`,
    );
    return jsonError("UNAVAILABLE", "Sinkronisasi belum dikonfigurasi.", 503);
  }

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!provided || !tokenMatches(provided, expected)) {
    return jsonError("UNAUTHORIZED", "Token tidak valid.", 401);
  }

  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BODY_BYTES) {
      return jsonError("TOO_LARGE", "Ukuran data terlalu besar.", 413);
    }

    const body = (await request.json().catch(() => null)) as {
      rows?: unknown;
      dryRun?: unknown;
    } | null;

    if (!body || !Array.isArray(body.rows)) {
      return jsonError("VALIDATION_ERROR", "Body harus berisi array rows.", 400);
    }

    if (body.rows.length > MAX_IMPORT_ROWS) {
      return jsonError(
        "TOO_LARGE",
        `Jumlah baris melebihi batas ${MAX_IMPORT_ROWS}.`,
        413,
      );
    }

    const summary = await runMahasiswaSync({
      records: recordsFromObjects(body.rows),
      mode: body.dryRun === true ? "preview" : "apply",
      source: "otomatis",
      actor: null,
      request,
    });

    return successJson(
      summary,
      body.dryRun === true
        ? "Pemeriksaan selesai. Belum ada data yang disimpan."
        : "Data mahasiswa berhasil disinkronkan.",
    );
  } catch (error) {
    if (error instanceof MahasiswaSyncError) {
      return jsonError("VALIDATION_ERROR", error.message, error.statusCode);
    }

    return handleAdminApiError(
      error,
      "api:internal:mahasiswa-sync",
      "Sinkronisasi gagal diproses.",
    );
  }
}
