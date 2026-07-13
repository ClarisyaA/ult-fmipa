"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{field.label}</Label>
      {field.type === "textarea" ? (
        <Textarea
          id={id}
          value={value}
          maxLength={field.maxLength}
          disabled={disabled}
          onChange={(event) => onChange(field.name, event.target.value)}
        />
      ) : (
        <Input
          id={id}
          type={field.type === "date" ? "date" : "text"}
          value={value}
          maxLength={field.maxLength}
          disabled={disabled}
          onChange={(event) => onChange(field.name, event.target.value)}
        />
      )}
      {isLetterNumber ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {value.trim()
            ? "Nomor surat masih diisi manual sesuai format resmi fakultas. Sistem belum melakukan auto-numbering."
            : "Nomor surat wajib diisi sebelum PDF dapat dicetak."}
        </p>
      ) : null}
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
          const confirmed = window.confirm(
            "Nomor surat pada data ini sudah terisi. Mengubah nomor akan memengaruhi PDF yang dicetak ulang dari pengajuan ini. Lanjutkan?",
          );

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Surat</CardTitle>
        <CardDescription>
          Lengkapi metadata surat dan data penandatangan sebelum mencetak PDF resmi.
        </CardDescription>
        {readiness ? (
          <p
            className={
              readiness.isReady
                ? "text-sm text-[#0f5b45]"
                : "text-sm text-[#9a3412]"
            }
          >
            {readiness.message}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-5">
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

            <div className="grid gap-2">
              <Label htmlFor="letter-signer-picker">Pilih Penandatangan</Label>
              {metadata.signerPickerAvailable ? (
                <select
                  id="letter-signer-picker"
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
                <p className="rounded-lg border border-[#E7DED0] bg-[#fffdf9] px-3 py-2 text-sm text-muted-foreground">
                  {metadata.signerPickerMessage}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {metadata.commonFields.map((field) => (
                <FieldControl
                  key={field.name}
                  field={field}
                  value={values[field.name] ?? ""}
                  disabled={saving}
                  onChange={setFieldValue}
                />
              ))}
            </div>

            {metadata.serviceFields.length > 0 ? (
              <div className="grid gap-4 border-t border-[#E7DED0] pt-4 sm:grid-cols-2">
                {metadata.serviceFields.map((field) => (
                  <FieldControl
                    key={field.name}
                    field={field}
                    value={values[field.name] ?? ""}
                    disabled={saving}
                    onChange={setFieldValue}
                  />
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={resetForm}
              >
                Reset
              </Button>
              <Button type="button" disabled={saving} onClick={() => save()}>
                {saving ? "Menyimpan..." : "Simpan Data Surat"}
              </Button>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
