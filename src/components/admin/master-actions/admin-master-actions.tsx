"use client";

import { useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Edit, KeyRound, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { confirmToast } from "@/lib/confirm-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const DB_UNAVAILABLE_MESSAGE =
  "Koneksi database sedang tidak tersedia. Coba lagi beberapa saat lagi.";
const dialogScrollClassName =
  "max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto";
const dialogFormClassName = `${dialogScrollClassName} sm:max-w-xl`;
const dialogSmallFormClassName = `${dialogScrollClassName} sm:max-w-md`;

type LevelRow = {
  LEVEL_DATA_ID: number;
  LEVEL_DATA_NAME: string;
  FIELD_NAME: string;
};

type UnitRow = {
  unitId: string;
  levelDataId: number;
  levelDataCode: string;
  unitName: string;
};

type LevelOption = {
  LEVEL_DATA_ID: number;
  LEVEL_DATA_NAME: string;
};

type MahasiswaRow = {
  npm: string;
  nama: string | null;
  kdPs: string | null;
  kdPa: string | null;
  programStudi: string | null;
  angkatan: number | null;
  status: string | null;
  fak: string | null;
};

type TracerRow = {
  id: number;
  npm: string | null;
  nama: string;
  program: string | null;
  prodi: string | null;
  tahunMasuk: number | null;
  tahunLulus: number | null;
  instansi: string | null;
  jabatan: string | null;
  statusIsi: number;
};

type UserRow = {
  USER_NAME: string;
  FULL_NAME: string;
  EMAIL: string;
  TELEPHONE: string | null;
  CONFIRMED: string;
  ACCESS_CODE: string;
  UNIT_ID: number;
};

type AccessRow = {
  ACCESS_CODE: string;
  DESCRIPTION: string;
};

type UnitOption = {
  unitId: string;
  unitName: string;
};

function getApiMessage(body: unknown, fallback: string) {
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "object" &&
    body.error !== null &&
    "message" in body.error &&
    typeof body.error.message === "string"
  ) {
    return body.error.message;
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
  ) {
    return body.error;
  }

  return fallback;
}

async function sendJson(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  data?: Record<string, unknown>,
) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: data ? JSON.stringify(data) : undefined,
  });
  const body = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(getApiMessage(body, "Aksi gagal diproses."));
  }

  return body;
}

function ActionMessage({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <p className="mt-2 rounded-md border border-[#dfebd7] bg-[#f7fbf3] px-3 py-2 text-[11px] font-semibold text-[#24513d]">
      {message}
    </p>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1 text-[11px] font-semibold text-[#5d665f]">
      {label}
      {children}
    </label>
  );
}

function useSaveAction() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (
    task: () => Promise<unknown>,
    successMessage: string,
    close?: () => void,
  ) => {
    setError(null);
    setMessage(null);
    try {
      await task();
      setMessage(successMessage);
      close?.();
      startTransition(() => router.refresh());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : DB_UNAVAILABLE_MESSAGE);
    }
  };

  return { isPending, message, error, run };
}

function DialogError({ error }: { error: string | null }) {
  if (!error) return null;

  return (
    <p className="rounded-md border border-[#f0c9c2] bg-[#fff5f2] px-3 py-2 text-[11px] font-semibold text-[#8a2d1b]">
      {error}
    </p>
  );
}

export function LevelCreateButton() {
  const [open, setOpen] = useState(false);
  const action = useSaveAction();

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="h-9 rounded-md bg-[#0f3d2e] text-xs">
            <Plus className="size-4" />
            Tambah Level
          </Button>
        </DialogTrigger>
        <DialogContent className={dialogSmallFormClassName}>
          <DialogHeader>
            <DialogTitle>Tambah Data Level</DialogTitle>
            <DialogDescription>
              Isi ID, nama level, dan field name sesuai struktur data lama.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              action.run(
                () =>
                  sendJson("/api/admin/system/levels", "POST", {
                    levelDataId: form.get("levelDataId"),
                    levelDataName: form.get("levelDataName"),
                    fieldName: form.get("fieldName"),
                  }),
                "Data level berhasil ditambahkan.",
                () => setOpen(false),
              );
            }}
          >
            <Field label="ID Level">
              <Input name="levelDataId" type="number" required />
            </Field>
            <Field label="Nama Level">
              <Input name="levelDataName" required />
            </Field>
            <Field label="Field Name">
              <Input name="fieldName" required />
            </Field>
            <DialogError error={action.error} />
            <Button disabled={action.isPending} className="bg-[#0f3d2e]">
              Simpan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <ActionMessage message={action.message} />
    </>
  );
}

export function LevelRowActions({ row }: { row: LevelRow }) {
  const [open, setOpen] = useState(false);
  const action = useSaveAction();

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 rounded-md text-xs">
            <Edit className="size-3.5" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent className={dialogSmallFormClassName}>
          <DialogHeader>
            <DialogTitle>Edit Data Level</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              action.run(
                () =>
                  sendJson(
                    `/api/admin/system/levels/${row.LEVEL_DATA_ID}`,
                    "PATCH",
                    {
                      levelDataName: form.get("levelDataName"),
                      fieldName: form.get("fieldName"),
                    },
                  ),
                "Data level berhasil diperbarui.",
                () => setOpen(false),
              );
            }}
          >
            <Field label="Nama Level">
              <Input
                name="levelDataName"
                defaultValue={row.LEVEL_DATA_NAME}
                required
              />
            </Field>
            <Field label="Field Name">
              <Input name="fieldName" defaultValue={row.FIELD_NAME} required />
            </Field>
            <DialogError error={action.error} />
            <Button disabled={action.isPending} className="bg-[#0f3d2e]">
              Simpan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 rounded-md border-[#f0c9c2] text-xs text-[#9b2f1f]"
        disabled={action.isPending}
        onClick={async () => {
          if (
            !(await confirmToast({
              title: "Hapus data level?",
              description: "Hapus data level ini?",
              confirmLabel: "Hapus",
              variant: "destructive",
            }))
          ) {
            return;
          }
          action.run(
            () =>
              sendJson(
                `/api/admin/system/levels/${row.LEVEL_DATA_ID}`,
                "DELETE",
              ),
            "Data level berhasil dihapus.",
          );
        }}
      >
        <Trash2 className="size-3.5" />
        Hapus
      </Button>
      <ActionMessage message={action.message} />
      <DialogError error={action.error} />
    </div>
  );
}

function UnitFormFields({
  row,
  levels,
}: {
  row?: UnitRow;
  levels: LevelOption[];
}) {
  return (
    <>
      <Field label="Level">
        <select
          name="levelDataId"
          defaultValue={row?.levelDataId ?? levels[0]?.LEVEL_DATA_ID ?? ""}
          className="h-9 w-full min-w-0 rounded-md border border-[#e1d8ca] bg-white px-3 text-sm"
          required
        >
          {levels.map((level) => (
            <option key={level.LEVEL_DATA_ID} value={level.LEVEL_DATA_ID}>
              {level.LEVEL_DATA_ID} - {level.LEVEL_DATA_NAME}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Kode Level">
        <Input name="levelDataCode" defaultValue={row?.levelDataCode ?? ""} required />
      </Field>
      <Field label="Nama Unit">
        <Input name="unitName" defaultValue={row?.unitName ?? ""} required />
      </Field>
    </>
  );
}

export function UnitCreateButton({ levels }: { levels: LevelOption[] }) {
  const [open, setOpen] = useState(false);
  const action = useSaveAction();

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="h-9 rounded-md bg-[#0f3d2e] text-xs">
            <Plus className="size-4" />
            Tambah Unit
          </Button>
        </DialogTrigger>
        <DialogContent className={dialogSmallFormClassName}>
          <DialogHeader>
            <DialogTitle>Tambah Unit</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              action.run(
                () =>
                  sendJson("/api/admin/system/units", "POST", {
                    levelDataId: form.get("levelDataId"),
                    levelDataCode: form.get("levelDataCode"),
                    unitName: form.get("unitName"),
                  }),
                "Unit berhasil ditambahkan.",
                () => setOpen(false),
              );
            }}
          >
            <UnitFormFields levels={levels} />
            <DialogError error={action.error} />
            <Button disabled={action.isPending} className="bg-[#0f3d2e]">
              Simpan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <ActionMessage message={action.message} />
    </>
  );
}

export function UnitRowActions({
  row,
  levels,
}: {
  row: UnitRow;
  levels: LevelOption[];
}) {
  const [open, setOpen] = useState(false);
  const action = useSaveAction();

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 rounded-md text-xs">
            <Edit className="size-3.5" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent className={dialogSmallFormClassName}>
          <DialogHeader>
            <DialogTitle>Edit Unit</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              action.run(
                () =>
                  sendJson(`/api/admin/system/units/${row.unitId}`, "PATCH", {
                    levelDataId: form.get("levelDataId"),
                    levelDataCode: form.get("levelDataCode"),
                    unitName: form.get("unitName"),
                  }),
                "Unit berhasil diperbarui.",
                () => setOpen(false),
              );
            }}
          >
            <UnitFormFields row={row} levels={levels} />
            <DialogError error={action.error} />
            <Button disabled={action.isPending} className="bg-[#0f3d2e]">
              Simpan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 rounded-md border-[#f0c9c2] text-xs text-[#9b2f1f]"
        disabled={action.isPending}
        onClick={async () => {
          if (
            !(await confirmToast({
              title: "Hapus unit?",
              description: "Hapus unit ini?",
              confirmLabel: "Hapus",
              variant: "destructive",
            }))
          ) {
            return;
          }
          action.run(
            () => sendJson(`/api/admin/system/units/${row.unitId}`, "DELETE"),
            "Unit berhasil dihapus.",
          );
        }}
      >
        <Trash2 className="size-3.5" />
        Hapus
      </Button>
      <ActionMessage message={action.message} />
      <DialogError error={action.error} />
    </div>
  );
}

function MahasiswaFields({ row }: { row?: MahasiswaRow }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {!row ? (
        <Field label="NPM">
          <Input name="npm" defaultValue="" required />
        </Field>
      ) : null}
      <Field label="Nama">
        <Input name="nama" defaultValue={row?.nama ?? ""} required />
      </Field>
      <Field label="Program Studi">
        <Input name="programStudi" defaultValue={row?.programStudi ?? ""} />
      </Field>
      <Field label="Jenjang">
        <Input name="jenjang" defaultValue={row?.status ?? ""} />
      </Field>
      <Field label="Angkatan">
        <Input name="angkatan" type="number" defaultValue={row?.angkatan ?? ""} />
      </Field>
      <Field label="Kode Prodi">
        <Input name="kdPs" defaultValue={row?.kdPs ?? ""} />
      </Field>
      <Field label="Kode PA">
        <Input name="kdPa" defaultValue={row?.kdPa ?? ""} />
      </Field>
      <Field label="Fakultas">
        <Input name="fak" defaultValue={row?.fak ?? ""} />
      </Field>
    </div>
  );
}

function mahasiswaPayload(form: FormData) {
  return {
    npm: form.get("npm"),
    nama: form.get("nama"),
    programStudi: form.get("programStudi"),
    jenjang: form.get("jenjang"),
    angkatan: form.get("angkatan"),
    kdPs: form.get("kdPs"),
    kdPa: form.get("kdPa"),
    fak: form.get("fak"),
  };
}

export function MahasiswaCreateButton() {
  const [open, setOpen] = useState(false);
  const action = useSaveAction();

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="h-9 rounded-md bg-[#0f3d2e] text-xs">
            <Plus className="size-4" />
            Tambah Mahasiswa
          </Button>
        </DialogTrigger>
        <DialogContent className={dialogFormClassName}>
          <DialogHeader>
            <DialogTitle>Tambah Mahasiswa</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              action.run(
                () =>
                  sendJson(
                    "/api/admin/master/mahasiswa",
                    "POST",
                    mahasiswaPayload(form),
                  ),
                "Data mahasiswa berhasil ditambahkan.",
                () => setOpen(false),
              );
            }}
          >
            <MahasiswaFields />
            <DialogError error={action.error} />
            <Button disabled={action.isPending} className="bg-[#0f3d2e]">
              Simpan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <ActionMessage message={action.message} />
    </>
  );
}

export function MahasiswaRowActions({ row }: { row: MahasiswaRow }) {
  const [open, setOpen] = useState(false);
  const action = useSaveAction();
  const url = `/api/admin/master/mahasiswa/${encodeURIComponent(row.npm)}`;

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 rounded-md text-xs">
            <Edit className="size-3.5" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent className={dialogFormClassName}>
          <DialogHeader>
            <DialogTitle>Edit Mahasiswa</DialogTitle>
            <DialogDescription>NPM tidak diubah dari form ini.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              action.run(
                () => sendJson(url, "PATCH", mahasiswaPayload(form)),
                "Data mahasiswa berhasil diperbarui.",
                () => setOpen(false),
              );
            }}
          >
            <MahasiswaFields row={row} />
            <DialogError error={action.error} />
            <Button disabled={action.isPending} className="bg-[#0f3d2e]">
              Simpan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 rounded-md border-[#f0c9c2] text-xs text-[#9b2f1f]"
        disabled={action.isPending}
        onClick={async () => {
          if (
            !(await confirmToast({
              title: "Hapus data mahasiswa?",
              description: "Hapus data mahasiswa ini?",
              confirmLabel: "Hapus",
              variant: "destructive",
            }))
          ) {
            return;
          }
          try {
            await sendJson(url, "DELETE");
            action.run(async () => undefined, "Data mahasiswa berhasil dihapus.");
            return;
          } catch (caught) {
            const message =
              caught instanceof Error ? caught.message : DB_UNAVAILABLE_MESSAGE;
            if (!message.includes("pengajuan layanan")) {
              action.run(async () => {
                throw new Error(message);
              }, "");
              return;
            }
            const forceConfirmed = await confirmToast({
              title: "Hapus paksa data mahasiswa?",
              description: `${message}\n\nHapus paksa data master mahasiswa ini?`,
              confirmLabel: "Hapus paksa",
              variant: "destructive",
            });

            if (!forceConfirmed) {
              action.run(async () => {
                throw new Error(message);
              }, "");
              return;
            }
            action.run(
              () => sendJson(url, "DELETE", { forceDelete: true }),
              "Data mahasiswa berhasil dihapus.",
            );
          }
        }}
      >
        <Trash2 className="size-3.5" />
        Hapus
      </Button>
      <ActionMessage message={action.message} />
      <DialogError error={action.error} />
    </div>
  );
}

function TracerFields({ row }: { row?: TracerRow }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="NPM">
        <Input name="npm" defaultValue={row?.npm ?? ""} />
      </Field>
      <Field label="Nama">
        <Input name="nama" defaultValue={row?.nama ?? ""} required />
      </Field>
      <Field label="Program">
        <Input name="program" defaultValue={row?.program ?? ""} />
      </Field>
      <Field label="Prodi">
        <Input name="prodi" defaultValue={row?.prodi ?? ""} />
      </Field>
      <Field label="Tahun Masuk">
        <Input name="tahunMasuk" type="number" defaultValue={row?.tahunMasuk ?? ""} />
      </Field>
      <Field label="Tahun Lulus">
        <Input name="tahunLulus" type="number" defaultValue={row?.tahunLulus ?? ""} />
      </Field>
      <Field label="Instansi">
        <Input name="instansi" defaultValue={row?.instansi ?? ""} />
      </Field>
      <Field label="Jabatan">
        <Input name="jabatan" defaultValue={row?.jabatan ?? ""} />
      </Field>
      <label className="flex items-center gap-2 text-[11px] font-semibold text-[#5d665f]">
        <input
          name="statusIsi"
          type="checkbox"
          defaultChecked={Boolean(row?.statusIsi)}
          value="1"
        />
        Tandai sudah terisi
      </label>
    </div>
  );
}

function tracerPayload(form: FormData) {
  return {
    npm: form.get("npm"),
    nama: form.get("nama"),
    program: form.get("program"),
    prodi: form.get("prodi"),
    tahunMasuk: form.get("tahunMasuk"),
    tahunLulus: form.get("tahunLulus"),
    instansi: form.get("instansi"),
    jabatan: form.get("jabatan"),
    statusIsi: form.get("statusIsi") === "1",
  };
}

export function TracerCreateButton() {
  const [open, setOpen] = useState(false);
  const action = useSaveAction();

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="h-9 rounded-md bg-[#0f3d2e] text-xs">
            <Plus className="size-4" />
            Tambah Tracer
          </Button>
        </DialogTrigger>
        <DialogContent className={dialogFormClassName}>
          <DialogHeader>
            <DialogTitle>Tambah Tracer Study</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              action.run(
                () =>
                  sendJson(
                    "/api/admin/alumni/tracer-study",
                    "POST",
                    tracerPayload(form),
                  ),
                "Data tracer study berhasil ditambahkan.",
                () => setOpen(false),
              );
            }}
          >
            <TracerFields />
            <DialogError error={action.error} />
            <Button disabled={action.isPending} className="bg-[#0f3d2e]">
              Simpan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <ActionMessage message={action.message} />
    </>
  );
}

export function TracerRowActions({ row }: { row: TracerRow }) {
  const [open, setOpen] = useState(false);
  const action = useSaveAction();
  const url = `/api/admin/alumni/tracer-study/${row.id}`;

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 rounded-md text-xs">
            <Edit className="size-3.5" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent className={dialogFormClassName}>
          <DialogHeader>
            <DialogTitle>Edit Tracer Study</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              action.run(
                () => sendJson(url, "PATCH", tracerPayload(form)),
                "Data tracer study berhasil diperbarui.",
                () => setOpen(false),
              );
            }}
          >
            <TracerFields row={row} />
            <DialogError error={action.error} />
            <Button disabled={action.isPending} className="bg-[#0f3d2e]">
              Simpan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 rounded-md border-[#f0c9c2] text-xs text-[#9b2f1f]"
        disabled={action.isPending}
        onClick={async () => {
          if (
            !(await confirmToast({
              title: "Hapus data tracer study?",
              description: "Hapus data tracer study ini?",
              confirmLabel: "Hapus",
              variant: "destructive",
            }))
          ) {
            return;
          }
          action.run(
            () => sendJson(url, "DELETE"),
            "Data tracer study berhasil dihapus.",
          );
        }}
      >
        <Trash2 className="size-3.5" />
        Hapus
      </Button>
      <ActionMessage message={action.message} />
      <DialogError error={action.error} />
    </div>
  );
}

export function UserRowActions({
  row,
  accessRows,
  units,
  currentUserEmail,
  currentLegacyUsername,
}: {
  row: UserRow;
  accessRows: AccessRow[];
  units: UnitOption[];
  currentUserEmail?: string | null;
  currentLegacyUsername?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const action = useSaveAction();
  const passwordAction = useSaveAction();
  const isSelf =
    currentLegacyUsername === row.USER_NAME || currentUserEmail === row.EMAIL;
  const currentUnit = useMemo(
    () => units.find((unit) => Number(unit.unitId) === row.UNIT_ID),
    [row.UNIT_ID, units],
  );

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 rounded-md text-xs">
            <Edit className="size-3.5" />
            Edit Aman
          </Button>
        </DialogTrigger>
        <DialogContent className={dialogFormClassName}>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Edit data akun aman. Gunakan tombol Reset Password untuk mengubah password.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              action.run(
                () =>
                  sendJson(
                    `/api/admin/system/users/${encodeURIComponent(row.USER_NAME)}`,
                    "PATCH",
                    {
                      fullName: form.get("fullName"),
                      email: form.get("email"),
                      telephone: form.get("telephone"),
                      accessCode: form.get("accessCode"),
                      unitId: form.get("unitId"),
                      confirmed: form.get("confirmed") === "1",
                    },
                  ),
                "Data user berhasil diperbarui.",
                () => setOpen(false),
              );
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {isSelf ? (
                <>
                  <input
                    type="hidden"
                    name="accessCode"
                    value={row.ACCESS_CODE}
                  />
                  <input
                    type="hidden"
                    name="unitId"
                    value={currentUnit?.unitId ?? String(row.UNIT_ID)}
                  />
                  <input type="hidden" name="confirmed" value="1" />
                </>
              ) : null}
              <Field label="Nama">
                <Input name="fullName" defaultValue={row.FULL_NAME} required />
              </Field>
              <Field label="Email">
                <Input name="email" defaultValue={row.EMAIL} required />
              </Field>
              <Field label="Telepon">
                <Input name="telephone" defaultValue={row.TELEPHONE ?? ""} />
              </Field>
              <Field label="Akses">
                <select
                  name="accessCode"
                  defaultValue={row.ACCESS_CODE}
                  disabled={isSelf}
                  title={
                    isSelf
                      ? "Akses akun yang sedang login tidak dapat diubah."
                      : undefined
                  }
                  className="h-9 w-full min-w-0 rounded-md border border-[#e1d8ca] bg-white px-3 text-sm disabled:bg-[#f4f1eb]"
                  required
                >
                  {accessRows.map((access) => (
                    <option key={access.ACCESS_CODE} value={access.ACCESS_CODE}>
                      {access.ACCESS_CODE} - {access.DESCRIPTION}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Unit">
                <select
                  name="unitId"
                  defaultValue={currentUnit?.unitId ?? String(row.UNIT_ID)}
                  disabled={isSelf}
                  title={
                    isSelf
                      ? "Unit akun yang sedang login tidak dapat diubah."
                      : undefined
                  }
                  className="h-9 w-full min-w-0 rounded-md border border-[#e1d8ca] bg-white px-3 text-sm disabled:bg-[#f4f1eb]"
                  required
                >
                  {units.map((unit) => (
                    <option key={unit.unitId} value={unit.unitId}>
                      {unit.unitName}
                    </option>
                  ))}
                </select>
              </Field>
              <label className="flex items-center gap-2 text-[11px] font-semibold text-[#5d665f]">
                <input
                  name="confirmed"
                  type="checkbox"
                  value="1"
                  disabled={isSelf}
                  title={
                    isSelf
                      ? "Akun yang sedang login tidak dapat dinonaktifkan."
                      : undefined
                  }
                  defaultChecked={row.CONFIRMED === "1"}
                />
                Aktif
              </label>
            </div>
            <DialogError error={action.error} />
            <Button disabled={action.isPending} className="bg-[#0f3d2e]">
              Simpan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-md text-xs"
            data-tour="admin-user-reset-password"
            data-tutorial-action="open-user-reset-password"
          >
            <KeyRound className="size-3.5" />
            Reset Password
          </Button>
        </DialogTrigger>
        <DialogContent className={dialogSmallFormClassName}>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Buat password baru untuk {row.FULL_NAME}. Password lama tidak perlu
              dimasukkan.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            data-tour="admin-user-reset-password-modal"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              passwordAction.run(
                () =>
                  sendJson(
                    `/api/admin/system/users/${encodeURIComponent(row.USER_NAME)}/password`,
                    "PATCH",
                    {
                      password: form.get("password"),
                      confirmPassword: form.get("confirmPassword"),
                    },
                  ),
                "Password user berhasil diperbarui.",
                () => setPasswordOpen(false),
              );
            }}
          >
            <Field label="Password Baru">
              <Input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                data-tour="admin-user-password"
              />
            </Field>
            <Field label="Konfirmasi Password">
              <Input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                data-tour="admin-user-confirm-password"
              />
            </Field>
            <DialogError error={passwordAction.error} />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={passwordAction.isPending}
                onClick={() => setPasswordOpen(false)}
              >
                Batal
              </Button>
              <Button disabled={passwordAction.isPending} className="bg-[#0f3d2e]">
                {passwordAction.isPending ? "Menyimpan..." : "Simpan Password"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 rounded-md border-[#f0c9c2] text-xs text-[#9b2f1f]"
        disabled={action.isPending || isSelf}
        title={
          isSelf
            ? "Akun yang sedang login tidak dapat dihapus."
            : "Hapus user"
        }
        onClick={async () => {
          if (
            !(await confirmToast({
              title: "Hapus user?",
              description: "Hapus user ini?",
              confirmLabel: "Hapus",
              variant: "destructive",
            }))
          ) {
            return;
          }
          action.run(
            () =>
              sendJson(
                `/api/admin/system/users/${encodeURIComponent(row.USER_NAME)}`,
                "DELETE",
              ),
            "User berhasil dihapus.",
          );
        }}
      >
        <Trash2 className="size-3.5" />
        Hapus
      </Button>
      <ActionMessage message={action.message} />
      <ActionMessage message={passwordAction.message} />
      <DialogError error={action.error} />
    </div>
  );
}

export function UserCreateButton({
  accessRows,
  units,
}: {
  accessRows: AccessRow[];
  units: UnitOption[];
}) {
  const [open, setOpen] = useState(false);
  const action = useSaveAction();

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="h-9 rounded-md bg-[#0f3d2e] text-xs"
            data-tour="admin-users-add-button"
            data-tutorial-action="open-user-create-form"
          >
            <Plus className="size-4" />
            Tambah User
          </Button>
        </DialogTrigger>
        <DialogContent className={dialogFormClassName}>
          <DialogHeader>
            <DialogTitle>Tambah User</DialogTitle>
            <DialogDescription>
              Password disimpan mengikuti format login legacy yang sudah dipakai.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              action.run(
                () =>
                  sendJson("/api/admin/system/users", "POST", {
                    username: form.get("username"),
                    fullName: form.get("fullName"),
                    email: form.get("email"),
                    telephone: form.get("telephone"),
                    accessCode: form.get("accessCode"),
                    unitId: form.get("unitId"),
                    confirmed: form.get("confirmed") === "1",
                    password: form.get("password"),
                    confirmPassword: form.get("confirmPassword"),
                  }),
                "User berhasil ditambahkan.",
                () => setOpen(false),
              );
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Username">
                <Input
                  name="username"
                  maxLength={20}
                  required
                  data-tour="admin-user-username"
                />
              </Field>
              <Field label="Nama">
                <Input
                  name="fullName"
                  maxLength={50}
                  required
                  data-tour="admin-user-name"
                />
              </Field>
              <Field label="Email">
                <Input
                  name="email"
                  type="email"
                  maxLength={50}
                  required
                  data-tour="admin-user-email"
                />
              </Field>
              <Field label="Telepon">
                <Input
                  name="telephone"
                  maxLength={50}
                  data-tour="admin-user-phone"
                />
              </Field>
              <Field label="Akses">
                <select
                  name="accessCode"
                  className="h-9 w-full min-w-0 rounded-md border border-[#e1d8ca] bg-white px-3 text-sm"
                  required
                  data-tour="admin-user-access"
                >
                  {accessRows.map((access) => (
                    <option key={access.ACCESS_CODE} value={access.ACCESS_CODE}>
                      {access.ACCESS_CODE} - {access.DESCRIPTION}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Unit">
                <select
                  name="unitId"
                  className="h-9 w-full min-w-0 rounded-md border border-[#e1d8ca] bg-white px-3 text-sm"
                  required
                  data-tour="admin-user-unit"
                >
                  {units.map((unit) => (
                    <option key={unit.unitId} value={unit.unitId}>
                      {unit.unitName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Password">
                <Input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  data-tour="admin-user-password"
                />
              </Field>
              <Field label="Konfirmasi Password">
                <Input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  data-tour="admin-user-confirm-password"
                />
              </Field>
              <label
                className="flex items-center gap-2 text-[11px] font-semibold text-[#5d665f]"
                data-tour="admin-user-active"
              >
                <input
                  name="confirmed"
                  type="checkbox"
                  value="1"
                  defaultChecked
                />
                Aktif
              </label>
            </div>
            <DialogError error={action.error} />
            <Button
              disabled={action.isPending}
              className="bg-[#0f3d2e]"
              data-tour="admin-user-save"
            >
              Simpan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <ActionMessage message={action.message} />
    </>
  );
}
