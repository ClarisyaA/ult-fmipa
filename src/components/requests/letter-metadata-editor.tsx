"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { confirmToast } from "@/lib/confirm-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  LetterMetadataField,
  LetterMetadataIdentity,
  LetterMetadataPayload,
  LetterSignerOption,
} from "@/lib/letters/letter-metadata";

type LetterMetadataEditorProps = {
  serviceSlug: string;
  id: string;
  initialReadiness?: {
    isReady: boolean;
    message: string;
  } | null;
};

type FieldValues = Record<string, string>;

const serviceTitles: Record<string, string> = {
  "keterangan-lulus": "Permintaan Layanan Surat Keterangan Lulus",
  "ket-tunjangan-orang-tua":
    "Surat Keterangan Masih Kuliah Tunjangan Orang Tua",
  "keterangan-masih-kuliah": "Surat Keterangan Masih Aktif Kuliah",
  "keterangan-kelakuan-baik":
    "Perubahan Permintaan Layanan Keterangan Kelakuan Baik",
  "permohonan-magang-kerja-praktek-ta":
    "Surat Permohonan Magang / Kerja Praktek / Tugas Akhir",
};

const keteranganLulusIdentityFields = new Set([
  "TEMPAT_LAHIR",
  "TGL_LAHIR",
  "TGL_LULUS",
  "IPK",
  "YUDISIUM",
]);

const keteranganLulusBasisFields = new Set([
  "DASAR_SURAT_TGL",
  "DASAR_SURAT_NO",
  "DASAR_SURAT_PERIHAL",
]);

const keteranganLulusApprovalServiceFields = new Set([
  "TTD_TANGGAL_BERLAKU",
  "TTD_AN",
]);

function printHref(serviceSlug: string, id: string, language: "id" | "en") {
  return `/api/requests/${serviceSlug}/${id}/pdf?lang=${language}`;
}

function collectValues(metadata: LetterMetadataPayload): FieldValues {
  const entries = [...metadata.commonFields, ...metadata.serviceFields].map(
    (field) => [field.name, field.value],
  );

  return Object.fromEntries(entries);
}

function getErrorMessage(body: unknown, fallback: string) {
  if (typeof body === "object" && body !== null && "error" in body) {
    const error = (body as { error?: unknown }).error;

    if (typeof error === "string") {
      return error;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      return (error as { message: string }).message;
    }
  }

  return fallback;
}

function FieldControl({
  field,
  value,
  disabled,
  onChange,
}: {
  field: LetterMetadataField;
  value: string;
  disabled: boolean;
  onChange: (name: string, value: string) => void;
}) {
  const id = `letter-${field.name}`;
  const isLetterNumber = field.name === "TTD_NO_SURAT";
  const hasInvalidSelectValue =
    field.type === "select" &&
    value.trim() !== "" &&
    !field.options?.includes(value);
  const inputClassName =
    "h-8 w-full rounded-[4px] border border-[#9c9c9c] bg-white px-2 text-[15px] text-[#1f1f1f] shadow-inner outline-none transition focus:border-[#00669b] focus:ring-2 focus:ring-[#00669b]/15 disabled:bg-[#f4f4f4] md:max-w-[560px]";
  const optionLabel = (option: string) => {
    if (field.name === "BAHASA_SURAT") {
      return option === "en" ? "Bahasa Inggris" : "Bahasa Indonesia";
    }

    return option;
  };

  return (
    <div className="grid gap-1 md:grid-cols-[174px_minmax(0,1fr)] md:items-start">
      <Label
        htmlFor={id}
        className="pt-1 text-[15px] font-medium leading-6 text-[#1c1c1c]"
      >
        {field.label}
      </Label>
      <div className="min-w-0">
        {field.type === "textarea" ? (
          <Textarea
            id={id}
            value={value}
            maxLength={field.maxLength}
            disabled={disabled}
            className="min-h-[86px] w-full rounded-[4px] border border-[#9c9c9c] bg-white px-2 py-1.5 text-[15px] leading-snug text-[#1f1f1f] shadow-inner outline-none transition focus:border-[#00669b] focus:ring-2 focus:ring-[#00669b]/15 disabled:bg-[#f4f4f4] md:max-w-[560px]"
            onChange={(event) => onChange(field.name, event.target.value)}
          />
        ) : field.type === "select" ? (
          <select
            id={id}
            value={value}
            disabled={disabled}
            className={`${inputClassName} md:max-w-[320px]`}
            onChange={(event) => onChange(field.name, event.target.value)}
          >
            <option value="">Pilih {field.label}</option>
            {hasInvalidSelectValue ? (
              <option value={value}>
                Nilai saat ini: {value} (tidak resmi)
              </option>
            ) : null}
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {optionLabel(option)}
              </option>
            ))}
          </select>
        ) : (
          <Input
            id={id}
            type={field.type === "date" ? "date" : "text"}
            value={value}
            maxLength={field.maxLength}
            disabled={disabled}
            className={
              field.type === "date"
                ? `${inputClassName} md:max-w-[260px]`
                : inputClassName
            }
            onChange={(event) => onChange(field.name, event.target.value)}
          />
        )}
        {isLetterNumber ? (
          <p className="mt-1 max-w-[560px] text-xs leading-relaxed text-[#6d6258]">
            {value.trim()
              ? "Nomor surat masih diisi manual sesuai format resmi fakultas. Sistem belum melakukan auto-numbering."
              : "Nomor surat wajib diisi sebelum PDF dapat dicetak."}
          </p>
        ) : null}
        {field.name === "YUDISIUM" && hasInvalidSelectValue ? (
          <p className="mt-1 max-w-[560px] text-xs leading-relaxed text-[#9a3412]">
            Yudisium saat ini tidak sesuai pilihan resmi. Pilih ulang sebelum
            mencetak surat.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ReadOnlyIdentitySection({
  identity,
}: {
  identity: LetterMetadataIdentity;
}) {
  const rows = [
    { label: "NPM", value: identity.npm },
    { label: "Nama Mahasiswa", value: identity.name },
    { label: "Program Studi", value: identity.programStudy },
    { label: "Email", value: identity.email },
    { label: "No HP/WhatsApp", value: identity.phone },
  ];

  return (
    <Fieldset title="Identitas Mahasiswa">
      <div className="grid gap-2 rounded-[4px] border border-[#d5d5d5] bg-white p-3 md:max-w-[760px]">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 text-sm md:grid-cols-[174px_minmax(0,1fr)]"
          >
            <span className="font-medium text-[#6d6258]">{row.label}</span>
            <span className="break-words font-semibold text-[#1f1f1f]">
              {row.value?.trim() ? row.value : "-"}
            </span>
          </div>
        ))}
      </div>
    </Fieldset>
  );
}

function Fieldset({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded-none border-2 border-[#a9a9a9] bg-transparent px-5 pb-5 pt-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
      <legend className="px-1 text-[16px] font-bold leading-none text-[#101010] underline underline-offset-2">
        {title}
      </legend>
      <div className="mt-3 grid gap-2.5">{children}</div>
    </fieldset>
  );
}

function SignerPickerRow({
  metadata,
  saving,
  applySigner,
}: {
  metadata: LetterMetadataPayload;
  saving: boolean;
  applySigner: (signerId: string) => void;
}) {
  return (
    <div className="grid gap-1 md:grid-cols-[174px_minmax(0,1fr)] md:items-start">
      <Label
        htmlFor="letter-signer-picker"
        className="pt-1 text-[15px] font-medium leading-6 text-[#1c1c1c]"
      >
        Pilih Penandatangan
      </Label>
      {metadata.signerPickerAvailable ? (
        <select
          id="letter-signer-picker"
          className="h-8 w-full rounded-[4px] border border-[#9c9c9c] bg-white px-2 text-[15px] text-[#1f1f1f] shadow-inner outline-none transition focus:border-[#00669b] focus:ring-2 focus:ring-[#00669b]/15 disabled:bg-[#f4f4f4] md:max-w-[560px]"
          disabled={saving}
          defaultValue=""
          onChange={(event) => applySigner(event.target.value)}
        >
          <option value="">Pilih dari master penandatangan...</option>
          {metadata.signers.map((signer) => (
            <option key={signer.id} value={signer.id}>
              {signerLabel(signer)}
            </option>
          ))}
        </select>
      ) : (
        <p className="max-w-[560px] rounded-[4px] border border-[#d5d5d5] bg-[#fafafa] px-3 py-1.5 text-sm text-[#5f5a54]">
          {metadata.signerPickerMessage}
        </p>
      )}
    </div>
  );
}

function signerLabel(signer: LetterSignerOption) {
  return [signer.name, signer.title, signer.nip ? `NIP ${signer.nip}` : null]
    .filter(Boolean)
    .join(" - ");
}

export function LetterMetadataEditor({
  serviceSlug,
  id,
  initialReadiness,
}: LetterMetadataEditorProps) {
  const router = useRouter();
  const [metadata, setMetadata] = useState<LetterMetadataPayload | null>(null);
  const [values, setValues] = useState<FieldValues>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const endpoint = `/api/requests/${serviceSlug}/${id}/letter-metadata`;

  useEffect(() => {
    let active = true;

    async function loadMetadata() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(endpoint, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const body = (await response.json()) as unknown;

        if (!response.ok) {
          throw new Error(getErrorMessage(body, "Data surat gagal dimuat."));
        }

        const data = (body as { data: LetterMetadataPayload }).data;

        if (active) {
          setMetadata(data);
          setValues(collectValues(data));
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Data surat gagal dimuat.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMetadata();

    return () => {
      active = false;
    };
  }, [endpoint]);

  const allFields = useMemo(
    () => (metadata ? [...metadata.commonFields, ...metadata.serviceFields] : []),
    [metadata],
  );

  const readiness = metadata?.readiness ?? initialReadiness ?? null;
  const groupedFields = useMemo(() => {
    if (!metadata) {
      return {
        identityFields: [] as LetterMetadataField[],
        basisFields: [] as LetterMetadataField[],
        serviceFields: [] as LetterMetadataField[],
        approvalServiceFields: [] as LetterMetadataField[],
        approvalFields: [] as LetterMetadataField[],
      };
    }

    if (serviceSlug !== "keterangan-lulus") {
      return {
        identityFields: [] as LetterMetadataField[],
        basisFields: [] as LetterMetadataField[],
        serviceFields: metadata.serviceFields,
        approvalServiceFields: [] as LetterMetadataField[],
        approvalFields: metadata.commonFields,
      };
    }

    return {
      identityFields: metadata.serviceFields.filter((field) =>
        keteranganLulusIdentityFields.has(field.name),
      ),
      basisFields: metadata.serviceFields.filter((field) =>
        keteranganLulusBasisFields.has(field.name),
      ),
      serviceFields: [] as LetterMetadataField[],
      approvalServiceFields: metadata.serviceFields.filter((field) =>
        keteranganLulusApprovalServiceFields.has(field.name),
      ),
      approvalFields: metadata.commonFields,
    };
  }, [metadata, serviceSlug]);

  const setFieldValue = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setSuccess(null);
  };

  const applySigner = (signerId: string) => {
    if (!metadata || !signerId) {
      return;
    }

    const signer = metadata.signers.find(
      (item) => String(item.id) === signerId,
    );

    if (!signer) {
      return;
    }

    setValues((current) => ({
      ...current,
      TTD_JABATAN: signer.title,
      TTD_PANGKAT_GOLONGAN:
        current.TTD_PANGKAT_GOLONGAN !== undefined
          ? signer.rank
          : current.TTD_PANGKAT_GOLONGAN,
      TTD_NAMA: signer.name,
      TTD_NIP: signer.nip,
      TTD_AN: current.TTD_AN !== undefined ? signer.actingFor : current.TTD_AN,
    }));
    setSuccess(null);
  };

  const resetForm = () => {
    if (!metadata) {
      return;
    }

    setValues(collectValues(metadata));
    setError(null);
    setSuccess(null);
  };

  const save = async (options?: { confirmNumberOverwrite?: boolean }) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = Object.fromEntries(
        allFields.map((field) => [field.name, values[field.name] ?? ""]),
      );
      const requestBody = options?.confirmNumberOverwrite
        ? { ...payload, confirmNumberOverwrite: true }
        : payload;
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      const body = (await response.json()) as unknown;

      if (!response.ok) {
        if (response.status === 409 && !options?.confirmNumberOverwrite) {
          const confirmed = await confirmToast({
            title: "Ubah nomor surat?",
            description:
              "Nomor surat pada data ini sudah terisi. Mengubah nomor akan memengaruhi PDF yang dicetak ulang dari pengajuan ini. Lanjutkan?",
            confirmLabel: "Lanjutkan",
          });

          if (confirmed) {
            await save({ confirmNumberOverwrite: true });
          }

          return;
        }

        throw new Error(getErrorMessage(body, "Data surat gagal disimpan."));
      }

      const data = (body as { data: LetterMetadataPayload }).data;
      setMetadata(data);
      setValues(collectValues(data));
      setSuccess("Data surat berhasil disimpan.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Data surat gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrintClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (readiness?.isReady === false) {
      e.preventDefault();

      toast.error("Data surat belum lengkap", {
        description:
          readiness.message ??
          "Lengkapi nomor surat, tanggal surat, dan penandatangan terlebih dahulu.",
        action: {
          label: "Lengkapi Data Surat",
          onClick: () => {
            const target =
              document.getElementById("letter-TTD_NO_SURAT") ||
              document.querySelector("[data-tour='admin-request-letter-metadata']");

            if (target) {
              target.scrollIntoView({ behavior: "smooth", block: "center" });
              (target as HTMLElement).focus?.();
            }
          },
        },
      });
    }
  };

  return (
    <Card
      className="overflow-hidden rounded-none border-2 border-[#0f5b45] bg-[#fffaf2] shadow-sm"
      id="data-surat"
      data-tour="admin-request-letter-metadata"
    >
      <CardHeader
        className="border-b border-[#b8b8b8] bg-[#fffaf2] px-5 py-4"
        data-tour={
          serviceSlug === "permohonan-magang-kerja-praktek-ta"
            ? "admin-magang-letter"
            : "admin-preview-letter-metadata"
        }
      >
        <CardTitle className="text-[24px] font-bold leading-tight text-[#00669b]">
          {serviceTitles[serviceSlug] ?? "Data Surat"}
        </CardTitle>
        <CardDescription className="max-w-3xl text-sm text-[#5f5a54]">
          Lengkapi metadata surat dan data penandatangan sebelum mencetak PDF resmi.
        </CardDescription>
        {readiness ? (
          <p
            className={
              readiness.isReady
                ? "text-sm font-medium text-[#0f5b45]"
                : "text-sm font-medium text-[#9a3412]"
            }
          >
            {readiness.message}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-5 bg-[#fffaf2] p-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat data surat...</p>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {success ? (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        ) : null}

        {metadata && !loading ? (
          <>
            {metadata.duplicateNumber.hasDuplicateNumber ? (
              <Alert>
                <AlertDescription>
                  Nomor surat ini terdeteksi sudah pernah digunakan pada pengajuan
                  lain. Periksa kembali sebelum mencetak.
                </AlertDescription>
              </Alert>
            ) : null}

            <ReadOnlyIdentitySection identity={metadata.identity} />

            {serviceSlug === "keterangan-lulus" ? (
              <Alert>
                <AlertDescription>
                  Pastikan IPK dan Yudisium sudah divalidasi dengan data akademik
                  resmi sebelum mencetak surat.
                </AlertDescription>
              </Alert>
            ) : null}

            {groupedFields.identityFields.length > 0 ? (
              <Fieldset title="Data Kelulusan">
                {groupedFields.identityFields.map((field) => (
                  <FieldControl
                    key={field.name}
                    field={field}
                    value={values[field.name] ?? ""}
                    disabled={saving}
                    onChange={setFieldValue}
                  />
                ))}
              </Fieldset>
            ) : null}

            {groupedFields.serviceFields.length > 0 ? (
              <Fieldset title="Data Layanan">
                {groupedFields.serviceFields.map((field) => (
                  <FieldControl
                    key={field.name}
                    field={field}
                    value={values[field.name] ?? ""}
                    disabled={saving}
                    onChange={setFieldValue}
                  />
                ))}
              </Fieldset>
            ) : null}

            {groupedFields.basisFields.length > 0 ? (
              <Fieldset title="Dasar Permintaan">
                {groupedFields.basisFields.map((field) => (
                  <FieldControl
                    key={field.name}
                    field={field}
                    value={values[field.name] ?? ""}
                    disabled={saving}
                    onChange={setFieldValue}
                  />
                ))}
              </Fieldset>
            ) : null}

            <Fieldset title="Pengesahan Surat">
              <SignerPickerRow
                metadata={metadata}
                saving={saving}
                applySigner={applySigner}
              />
              {groupedFields.approvalServiceFields.map((field) => (
                <FieldControl
                  key={field.name}
                  field={field}
                  value={values[field.name] ?? ""}
                  disabled={saving}
                  onChange={setFieldValue}
                />
              ))}
              {groupedFields.approvalFields.map((field) => (
                <FieldControl
                  key={field.name}
                  field={field}
                  value={values[field.name] ?? ""}
                  disabled={saving}
                  onChange={setFieldValue}
                />
              ))}
            </Fieldset>

            <div className="grid gap-2 md:grid-cols-[174px_minmax(0,1fr)]">
              <div className="hidden border-t border-[#b8b8b8] md:block" />
              <div
                className="flex flex-wrap gap-2 border-t border-[#b8b8b8] pt-4"
                data-tour="admin-request-print-buttons"
              >
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  className="h-9 rounded-[4px] border-[#9c9c9c] bg-[#f5f5f5] px-4 text-[15px] text-[#1f1f1f] hover:bg-[#ececec]"
                  onClick={resetForm}
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  disabled={saving}
                  className="h-9 rounded-[4px] bg-[#00669b] px-5 text-[15px] font-semibold text-white hover:bg-[#00547f]"
                  onClick={() => save()}
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </Button>
                <span className="contents" data-tour="admin-preview-print-buttons">
                <Button
                  asChild
                  type="button"
                  variant="outline"
                  disabled={saving}
                  className="h-9 rounded-[4px] border-[#0f5b45] bg-white px-5 text-[15px] font-semibold text-[#0f5b45] hover:bg-[#eef9f1]"
                >
                  <Link
                    href={printHref(serviceSlug, id, "id")}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handlePrintClick}
                  >
                    Cetak Surat Indo
                  </Link>
                </Button>
                <Button
                  asChild
                  type="button"
                  variant="outline"
                  disabled={saving}
                  className="h-9 rounded-[4px] border-[#0f5b45] bg-white px-5 text-[15px] font-semibold text-[#0f5b45] hover:bg-[#eef9f1]"
                >
                  <Link
                    href={printHref(serviceSlug, id, "en")}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handlePrintClick}
                  >
                    Cetak Surat Inggris
                  </Link>
                </Button>
                </span>
              </div>
              {readiness?.isReady === false ? (
                <>
                  <div className="hidden md:block" />
                  <p className="text-sm font-medium text-[#9a3412]">
                    Lengkapi Data Surat sebelum mencetak PDF resmi.
                  </p>
                </>
              ) : null}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
