"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CreateServiceRequestResult } from "@/types/submission";

type ServiceRequestFormProps = {
  serviceSlug: string;
  isScholarshipService: boolean;
};

export function ServiceRequestForm({
  serviceSlug,
  isScholarshipService,
}: ServiceRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CreateServiceRequestResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    setError("");
    setResult(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(form);
      const response = await fetch(`/api/services/${serviceSlug}/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          npm: formData.get("npm"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          description: formData.get("description"),
          scholarshipName: formData.get("scholarshipName"),
        }),
      });

      const body = (await response.json().catch(() => null)) as {
        data?: CreateServiceRequestResult;
        error?: string;
      } | null;

      if (!response.ok || !body?.data) {
        setError(body?.error ?? "Pengajuan layanan gagal dikirim.");
        return;
      }

      form.reset();
      setResult(body.data);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="grid gap-4 rounded-lg border bg-muted/30 p-4">
        <div>
          <p className="font-medium">Pengajuan layanan berhasil dikirim.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nomor pengajuan: {result.id}. Status awal: Menunggu Proses.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/layanan/${serviceSlug}`}>Kembali ke Detail Layanan</Link>
        </Button>
      </div>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="npm">NPM</Label>
        <Input id="npm" name="npm" minLength={8} maxLength={15} required />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">No HP/WhatsApp</Label>
          <Input id="phone" name="phone" maxLength={20} />
        </div>
      </div>

      {isScholarshipService ? (
        <div className="grid gap-2">
          <Label htmlFor="scholarshipName">Nama Beasiswa</Label>
          <Input id="scholarshipName" name="scholarshipName" maxLength={100} />
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="description">Keterangan/Keperluan</Label>
        <Textarea id="description" name="description" maxLength={100} />
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
      </Button>
    </form>
  );
}
