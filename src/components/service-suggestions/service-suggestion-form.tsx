"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ServiceSuggestionFormProps = {
  initialNama?: string;
  initialNpm?: string;
  lockNpm?: boolean;
};

type FormValues = {
  nama: string;
  npm: string;
  layananDiajukan: string;
  detailLayanan: string;
  saranPeningkatan: string;
};

const initialValues: FormValues = {
  nama: "",
  npm: "",
  layananDiajukan: "",
  detailLayanan: "",
  saranPeningkatan: "",
};

function getErrorMessage(body: unknown, fallback: string) {
  if (body && typeof body === "object") {
    if (
      "error" in body &&
      body.error &&
      typeof body.error === "object" &&
      "message" in body.error &&
      typeof body.error.message === "string"
    ) {
      return body.error.message;
    }

    if ("message" in body && typeof body.message === "string") {
      return body.message;
    }

    if ("error" in body && typeof body.error === "string") {
      return body.error;
    }
  }

  return fallback;
}

export function ServiceSuggestionForm({
  initialNama = "",
  initialNpm = "",
  lockNpm = false,
}: ServiceSuggestionFormProps) {
  const [values, setValues] = useState<FormValues>({
    ...initialValues,
    nama: initialNama,
    npm: initialNpm,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function updateValue(field: keyof FormValues, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/service-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      const body = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        const message = getErrorMessage(body, "Usulan layanan gagal dikirim.");
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      const message =
        "Usulan layanan berhasil dikirim. Terima kasih atas masukan Anda.";
      setSuccessMessage(message);
      toast.success(message);
      setValues({
        ...initialValues,
        nama: initialNama,
        npm: initialNpm,
      });
    } catch {
      const message =
        "Usulan layanan gagal dikirim. Periksa koneksi lalu coba lagi.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="nama">
            Nama <span className="text-[#d9232e]">*</span>
          </Label>
          <Input
            id="nama"
            name="nama"
            value={values.nama}
            maxLength={200}
            required
            onChange={(event) => updateValue("nama", event.currentTarget.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="npm">
            NPM <span className="text-[#d9232e]">*</span>
          </Label>
          <Input
            id="npm"
            name="npm"
            value={values.npm}
            maxLength={50}
            required
            readOnly={lockNpm}
            className={lockNpm ? "bg-[#f4f1eb]" : undefined}
            onChange={(event) => updateValue("npm", event.currentTarget.value)}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="layananDiajukan">
          Layanan yang ingin diajukan <span className="text-[#d9232e]">*</span>
        </Label>
        <Input
          id="layananDiajukan"
          name="layananDiajukan"
          value={values.layananDiajukan}
          maxLength={200}
          required
          onChange={(event) =>
            updateValue("layananDiajukan", event.currentTarget.value)
          }
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="detailLayanan">
          Detail Layanan yang ingin diajukan{" "}
          <span className="text-[#d9232e]">*</span>
        </Label>
        <Textarea
          id="detailLayanan"
          name="detailLayanan"
          value={values.detailLayanan}
          maxLength={2000}
          required
          className="min-h-36"
          onChange={(event) =>
            updateValue("detailLayanan", event.currentTarget.value)
          }
        />
        <p className="text-xs text-[#786f63]">
          Jelaskan kebutuhan, tujuan, atau contoh layanan yang Anda harapkan.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="saranPeningkatan">
          Saran peningkatan layanan yang sudah ada{" "}
          <span className="text-xs font-normal text-[#786f63]">Opsional</span>
        </Label>
        <Textarea
          id="saranPeningkatan"
          name="saranPeningkatan"
          value={values.saranPeningkatan}
          maxLength={2000}
          className="min-h-32"
          onChange={(event) =>
            updateValue("saranPeningkatan", event.currentTarget.value)
          }
        />
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      <Button
        type="submit"
        className="h-11 w-full rounded-xl bg-[#0f5b45] font-bold text-white hover:bg-[#0f3d2e] sm:w-fit sm:px-7"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Mengirim..." : "Kirim Usulan"}
      </Button>
    </form>
  );
}
