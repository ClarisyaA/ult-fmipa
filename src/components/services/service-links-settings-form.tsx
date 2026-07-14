"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_SCHOLARSHIP_TEMPLATE_URL } from "@/lib/service-link-constants";

type ServiceLinkSummary = {
  url: string;
  isActive: boolean;
};

type ServiceLinksSettingsFormProps = {
  rolePrefix: "admin" | "staff";
  initialLink?: ServiceLinkSummary | null;
  unavailable?: boolean;
};

export function ServiceLinksSettingsForm({
  rolePrefix,
  initialLink,
  unavailable = false,
}: ServiceLinksSettingsFormProps) {
  const router = useRouter();
  const [url, setUrl] = useState(initialLink?.url ?? DEFAULT_SCHOLARSHIP_TEMPLATE_URL);
  const [isActive, setIsActive] = useState(initialLink?.isActive ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(
    unavailable ? "Koneksi database sedang tidak tersedia. Coba lagi beberapa saat lagi." : ""
  );
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/${rolePrefix}/service-links/rekomendasi-beasiswa/scholarship-recommendation-template`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
            isActive,
          }),
        }
      );
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
      } | null;

      if (!response.ok) {
        setError(body?.error ?? "Link template Rekomendasi Beasiswa gagal disimpan.");
        return;
      }

      setSuccess(
        body?.message ?? "Link template Rekomendasi Beasiswa berhasil disimpan."
      );
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="scholarship-template-url" className="text-xs font-semibold text-[#39433c]">
          Link Template Rekomendasi Beasiswa
        </Label>
        <Input
          id="scholarship-template-url"
          type="url"
          maxLength={500}
          className="h-10 rounded-md border-[#e1d8ca] text-sm focus-visible:ring-[#0f5b45]"
          value={url}
          onChange={(event) => setUrl(event.currentTarget.value)}
          placeholder={DEFAULT_SCHOLARSHIP_TEMPLATE_URL}
          disabled={unavailable}
          required
        />
        <p className="text-xs leading-relaxed text-[#7a7166]">
          Link ini digunakan oleh tombol template pada layanan Rekomendasi Beasiswa.
          Mahasiswa akan diarahkan ke Google Docs/Drive untuk menyalin atau mengunduh template.
        </p>
      </div>

      <label className="inline-flex min-h-9 w-fit items-center gap-2 rounded-md border border-[#e8dfd0] bg-white px-3 text-sm text-[#303b34]">
        <input
          type="checkbox"
          className="size-4 accent-[#0f5b45]"
          checked={isActive}
          onChange={(event) => setIsActive(event.currentTarget.checked)}
          disabled={unavailable}
        />
        Aktifkan tombol template Rekomendasi Beasiswa
      </label>

      {error ? (
        <p className="rounded-md border border-[#edd2c5] bg-[#fff7f2] px-3 py-2 text-sm text-[#8a3d23]">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-md border border-[#cce3d3] bg-[#eef9f1] px-3 py-2 text-sm text-[#2f6b44]">
          {success}
        </p>
      ) : null}

      <div className="flex justify-end border-t border-[#eee6d9] pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || unavailable}
          className="h-10 w-full rounded-md bg-[#0f3d2e] px-5 text-sm font-semibold text-white hover:bg-[#164b39] sm:w-auto"
        >
          {isSubmitting ? "Menyimpan..." : "Simpan Link Template"}
        </Button>
      </div>
    </form>
  );
}
