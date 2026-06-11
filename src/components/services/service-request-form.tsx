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
  defaultValues?: {
    npm?: string;
    email?: string | null;
    phone?: string;
  };
};

type ApiIssue = {
  field: string;
  message: string;
};

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export function ServiceRequestForm({
  serviceSlug,
  defaultValues,
}: ServiceRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CreateServiceRequestResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    setError("");
    setFieldErrors({});
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
          npm: getFormString(formData, "npm"),
          email: getFormString(formData, "email"),
          phone: getFormString(formData, "phone"),
          description: getFormString(formData, "description"),
          scholarshipName: getFormString(formData, "scholarshipName"),
          semester: getFormString(formData, "semester"),
          tahunAkademik: getFormString(formData, "tahunAkademik"),
          namaOrangTua: getFormString(formData, "namaOrangTua"),
          nipNrp: getFormString(formData, "nipNrp"),
          pangkatGolongan: getFormString(formData, "pangkatGolongan"),
          instansi: getFormString(formData, "instansi"),
          pengantar: getFormString(formData, "pengantar"),
          ditujukan: getFormString(formData, "ditujukan"),
          dasarSuratNo: getFormString(formData, "dasarSuratNo"),
          dasarSuratPerihal: getFormString(formData, "dasarSuratPerihal"),
          dasarSuratTgl: getFormString(formData, "dasarSuratTgl"),
          tempatLahir: getFormString(formData, "tempatLahir"),
          tanggalLahir: getFormString(formData, "tanggalLahir"),
          tanggalLulus: getFormString(formData, "tanggalLulus"),
          ipk: getFormString(formData, "ipk"),
          yudisium: getFormString(formData, "yudisium"),
          jumlahTranskrip: getFormString(formData, "jumlahTranskrip"),
          jumlahIjazah: getFormString(formData, "jumlahIjazah"),
          jumlahTranslet: getFormString(formData, "jumlahTranslet"),
        }),
      });

      const body = (await response.json().catch(() => null)) as {
        data?: CreateServiceRequestResult;
        error?: string;
        issues?: ApiIssue[];
      } | null;

      if (!response.ok || !body?.data) {
        const issues = body?.issues ?? [];
        const nextFieldErrors = Object.fromEntries(
          issues.map((issue) => [issue.field, issue.message])
        );

        setFieldErrors(nextFieldErrors);
        setError(
          issues[0]?.message ??
            body?.error ??
            "Pengajuan layanan gagal dikirim."
        );
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
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/mahasiswa/riwayat">Lihat Riwayat Pengajuan</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/layanan/${serviceSlug}`}>
              Kembali ke Detail Layanan
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const isScholarshipService = serviceSlug === "rekomendasi-beasiswa";
  const needsAcademicFields = [
    "ket-tunjangan-orang-tua",
    "keterangan-masih-kuliah",
  ].includes(serviceSlug);
  const needsParentFields = serviceSlug === "ket-tunjangan-orang-tua";
  const isSuratPengantar = serviceSlug === "surat-pengantar";
  const isKeteranganLulus = serviceSlug === "keterangan-lulus";
  const isIjazah = serviceSlug === "penerbitan-ijazah";
  const isLegalisir = serviceSlug === "legalisir-ijazah-transkrip";
  const showDescription = !isSuratPengantar && !isKeteranganLulus && !isIjazah;

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="npm">NPM</Label>
        <Input
          id="npm"
          name="npm"
          minLength={8}
          maxLength={15}
          defaultValue={defaultValues?.npm ?? ""}
          required
        />
        {fieldErrors.npm ? (
          <p className="text-sm text-destructive">{fieldErrors.npm}</p>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={defaultValues?.email ?? ""}
          />
          {fieldErrors.email ? (
            <p className="text-sm text-destructive">{fieldErrors.email}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">No HP/WhatsApp</Label>
          <Input
            id="phone"
            name="phone"
            maxLength={30}
            defaultValue={defaultValues?.phone ?? ""}
          />
          {fieldErrors.phone ? (
            <p className="text-sm text-destructive">{fieldErrors.phone}</p>
          ) : null}
        </div>
      </div>

      {isScholarshipService ? (
        <div className="grid gap-2">
          <Label htmlFor="scholarshipName">Nama Beasiswa</Label>
          <Input id="scholarshipName" name="scholarshipName" maxLength={100} />
          {fieldErrors.scholarshipName ? (
            <p className="text-sm text-destructive">
              {fieldErrors.scholarshipName}
            </p>
          ) : null}
        </div>
      ) : null}

      {needsAcademicFields ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="semester">Semester</Label>
            <Input id="semester" name="semester" maxLength={25} />
            {fieldErrors.semester ? (
              <p className="text-sm text-destructive">
                {fieldErrors.semester}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tahunAkademik">Tahun Akademik</Label>
            <Input id="tahunAkademik" name="tahunAkademik" maxLength={10} />
            {fieldErrors.tahunAkademik ? (
              <p className="text-sm text-destructive">
                {fieldErrors.tahunAkademik}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {needsParentFields ? (
        <div className="grid gap-4 rounded-lg border bg-muted/20 p-4">
          <p className="text-sm font-medium">Data Orang Tua</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="namaOrangTua">Nama Orang Tua</Label>
              <Input id="namaOrangTua" name="namaOrangTua" maxLength={100} />
              {fieldErrors.namaOrangTua ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.namaOrangTua}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nipNrp">NIP/NRP</Label>
              <Input id="nipNrp" name="nipNrp" maxLength={100} />
              {fieldErrors.nipNrp ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.nipNrp}
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="pangkatGolongan">Pangkat/Golongan</Label>
              <Input
                id="pangkatGolongan"
                name="pangkatGolongan"
                maxLength={100}
              />
              {fieldErrors.pangkatGolongan ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.pangkatGolongan}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="instansi">Instansi</Label>
              <Input id="instansi" name="instansi" maxLength={100} />
              {fieldErrors.instansi ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.instansi}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isSuratPengantar ? (
        <div className="grid gap-4 rounded-lg border bg-muted/20 p-4">
          <p className="text-sm font-medium">Data Surat Pengantar</p>
          <div className="grid gap-2">
            <Label htmlFor="pengantar">Pengantar</Label>
            <Textarea id="pengantar" name="pengantar" maxLength={150} />
            {fieldErrors.pengantar ? (
              <p className="text-sm text-destructive">
                {fieldErrors.pengantar}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ditujukan">Ditujukan</Label>
            <Input id="ditujukan" name="ditujukan" maxLength={150} />
            {fieldErrors.ditujukan ? (
              <p className="text-sm text-destructive">
                {fieldErrors.ditujukan}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="dasarSuratNo">No. Dasar Surat</Label>
              <Input id="dasarSuratNo" name="dasarSuratNo" maxLength={30} />
              {fieldErrors.dasarSuratNo ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.dasarSuratNo}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dasarSuratPerihal">Perihal</Label>
              <Input
                id="dasarSuratPerihal"
                name="dasarSuratPerihal"
                maxLength={100}
              />
              {fieldErrors.dasarSuratPerihal ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.dasarSuratPerihal}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dasarSuratTgl">Tanggal Dasar Surat</Label>
              <Input id="dasarSuratTgl" name="dasarSuratTgl" type="date" />
              {fieldErrors.dasarSuratTgl ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.dasarSuratTgl}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isKeteranganLulus || isIjazah ? (
        <div className="grid gap-4 rounded-lg border bg-muted/20 p-4">
          <p className="text-sm font-medium">Data Kelulusan</p>
          {isKeteranganLulus ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="tempatLahir">Tempat Lahir</Label>
                <Input id="tempatLahir" name="tempatLahir" maxLength={100} />
                {fieldErrors.tempatLahir ? (
                  <p className="text-sm text-destructive">
                    {fieldErrors.tempatLahir}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                <Input id="tanggalLahir" name="tanggalLahir" type="date" />
                {fieldErrors.tanggalLahir ? (
                  <p className="text-sm text-destructive">
                    {fieldErrors.tanggalLahir}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="tanggalLulus">Tanggal Lulus</Label>
              <Input id="tanggalLulus" name="tanggalLulus" type="date" />
              {fieldErrors.tanggalLulus ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.tanggalLulus}
                </p>
              ) : null}
            </div>
            {isKeteranganLulus ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="ipk">IPK</Label>
                  <Input id="ipk" name="ipk" maxLength={5} />
                  {fieldErrors.ipk ? (
                    <p className="text-sm text-destructive">
                      {fieldErrors.ipk}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="yudisium">Yudisium</Label>
                  <Input id="yudisium" name="yudisium" maxLength={25} />
                  {fieldErrors.yudisium ? (
                    <p className="text-sm text-destructive">
                      {fieldErrors.yudisium}
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {isLegalisir ? (
        <div className="grid gap-4 rounded-lg border bg-muted/20 p-4">
          <p className="text-sm font-medium">Jumlah Dokumen</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="jumlahTranskrip">Transkrip</Label>
              <Input
                id="jumlahTranskrip"
                name="jumlahTranskrip"
                type="number"
                min={1}
                defaultValue={1}
              />
              {fieldErrors.jumlahTranskrip ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.jumlahTranskrip}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="jumlahIjazah">Ijazah</Label>
              <Input
                id="jumlahIjazah"
                name="jumlahIjazah"
                type="number"
                min={1}
                defaultValue={1}
              />
              {fieldErrors.jumlahIjazah ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.jumlahIjazah}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="jumlahTranslet">Terjemahan</Label>
              <Input
                id="jumlahTranslet"
                name="jumlahTranslet"
                type="number"
                min={1}
                defaultValue={1}
              />
              {fieldErrors.jumlahTranslet ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.jumlahTranslet}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showDescription ? (
        <div className="grid gap-2">
          <Label htmlFor="description">Keterangan/Keperluan</Label>
          <Textarea id="description" name="description" maxLength={100} />
          {fieldErrors.description ? (
            <p className="text-sm text-destructive">
              {fieldErrors.description}
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        Anda sedang mengajukan layanan sebagai mahasiswa development. Pada tahap
        berikutnya, data akan diambil dari PAUS OAuth.
      </p>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
      </Button>
    </form>
  );
}
