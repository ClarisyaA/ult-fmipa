"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const TEMPLATE_URL = "/templates/temp_data_mahasiswa.xlsx";

type Issue = { row: number; npm: string; message: string };

type Summary = {
  mode: "preview" | "apply";
  totalRows: number;
  validRows: number;
  toInsert: number;
  toUpdate: number;
  unchanged: number;
  failedRows: number;
  issues: Issue[];
  issuesTruncated: boolean;
  inserted: number;
  updated: number;
};

type ApiBody = {
  message?: string;
  data?: Summary;
  error?: { message?: string };
};

function SummaryCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[#e1d8ca] bg-white px-3 py-2">
      <p className="text-[11px] font-semibold text-[#7a7166]">{label}</p>
      <p className="text-lg font-bold text-[#303b34]">
        {value.toLocaleString("id-ID")}
      </p>
    </div>
  );
}

/**
 * Unggah Excel/CSV data mahasiswa. Template sama dengan sistem lama.
 * Langkah: pilih file -> "Periksa file" (tanpa menyimpan) -> "Simpan".
 */
export function MahasiswaImportButton({ endpoint }: { endpoint: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  function reset() {
    setFile(null);
    setSummary(null);
    setDone(null);
    setError(null);
  }

  async function send(mode: "preview" | "apply") {
    if (!file) return;

    setBusy(true);
    setError(null);
    setDone(null);

    try {
      const form = new FormData();
      form.set("file", file);
      form.set("mode", mode);

      const response = await fetch(endpoint, { method: "POST", body: form });
      const body = (await response.json().catch(() => null)) as ApiBody | null;

      if (!response.ok || !body?.data) {
        throw new Error(body?.error?.message ?? "File gagal diproses.");
      }

      setSummary(body.data);

      if (mode === "apply") {
        setDone(body.message ?? "Data mahasiswa berhasil disinkronkan.");
        startTransition(() => router.refresh());
      }
    } catch (caught) {
      setSummary(null);
      setError(caught instanceof Error ? caught.message : "File gagal diproses.");
    } finally {
      setBusy(false);
    }
  }

  const canApply =
    Boolean(summary) &&
    summary?.mode === "preview" &&
    !done &&
    (summary?.toInsert ?? 0) + (summary?.toUpdate ?? 0) > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-9 rounded-md border-[#e1d8ca] bg-white text-xs font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
        >
          <FileSpreadsheet className="size-4" />
          Import Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Data Mahasiswa</DialogTitle>
          <DialogDescription>
            NPM yang sudah ada akan diperbarui, NPM baru akan ditambahkan. Data
            tidak ada yang dihapus. Kolom yang dikosongkan tidak menimpa data
            lama.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <a
            href={TEMPLATE_URL}
            download
            className="inline-flex w-fit items-center gap-2 text-xs font-semibold text-[#0f3d2e] underline underline-offset-2"
          >
            <Download className="size-4" />
            Unduh template (NPM, Nama, Kode Prodi, Nama Prodi, Nama Jenjang,
            Angkatan)
          </a>

          <input
            type="file"
            accept=".xlsx,.csv"
            disabled={busy}
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setSummary(null);
              setDone(null);
              setError(null);
            }}
            className="block w-full text-xs file:mr-3 file:rounded-md file:border file:border-[#e1d8ca] file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold"
          />

          {error ? (
            <p className="rounded-md border border-[#f0c9c2] bg-[#fff5f2] px-3 py-2 text-[11px] font-semibold text-[#8a2d1b]">
              {error}
            </p>
          ) : null}

          {done ? (
            <p className="rounded-md border border-[#dfebd7] bg-[#f7fbf3] px-3 py-2 text-[11px] font-semibold text-[#24513d]">
              {done}
            </p>
          ) : null}

          {summary ? (
            <div className="grid gap-3">
              <p className="text-xs font-semibold text-[#303b34]">
                {summary.mode === "preview"
                  ? "Hasil pemeriksaan (belum disimpan)"
                  : "Hasil penyimpanan"}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <SummaryCell label="Baris dibaca" value={summary.totalRows} />
                <SummaryCell
                  label={summary.mode === "apply" ? "Ditambahkan" : "Akan ditambah"}
                  value={summary.mode === "apply" ? summary.inserted : summary.toInsert}
                />
                <SummaryCell
                  label={summary.mode === "apply" ? "Diperbarui" : "Akan diperbarui"}
                  value={summary.mode === "apply" ? summary.updated : summary.toUpdate}
                />
                <SummaryCell label="Tidak berubah" value={summary.unchanged} />
                <SummaryCell label="Baris gagal" value={summary.failedRows} />
              </div>

              {summary.issues.length > 0 ? (
                <div className="max-h-48 overflow-y-auto rounded-md border border-[#e1d8ca]">
                  <table className="w-full text-left text-[11px]">
                    <thead className="sticky top-0 bg-[#eef3ec]">
                      <tr>
                        <th className="px-2 py-1.5">Baris</th>
                        <th className="px-2 py-1.5">NPM</th>
                        <th className="px-2 py-1.5">Masalah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.issues.map((issue, index) => (
                        <tr key={`${issue.row}-${index}`} className="border-t border-[#eee6d9]">
                          <td className="px-2 py-1.5">{issue.row}</td>
                          <td className="px-2 py-1.5">{issue.npm || "-"}</td>
                          <td className="px-2 py-1.5">{issue.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {summary.issuesTruncated ? (
                    <p className="border-t border-[#eee6d9] px-2 py-1.5 text-[11px] text-[#7a7166]">
                      Hanya sebagian masalah yang ditampilkan.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!file || busy}
              onClick={() => send("preview")}
              className="h-9 rounded-md border-[#e1d8ca] text-xs font-semibold"
            >
              {busy ? "Memproses..." : "Periksa file"}
            </Button>
            <Button
              type="button"
              disabled={!canApply || busy}
              onClick={() => send("apply")}
              className="h-9 rounded-md bg-[#0f3d2e] text-xs font-semibold text-white hover:bg-[#164b39]"
            >
              Simpan perubahan
              {summary && summary.failedRows > 0
                ? ` (${summary.failedRows} baris dilewati)`
                : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
