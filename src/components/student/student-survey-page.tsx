"use client";

import { FormEvent, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StudentSurveyRequest } from "@/lib/service-surveys";

type SurveyRequestsResponse = {
  pending: StudentSurveyRequest[];
  submitted: StudentSurveyRequest[];
  tableAvailable: boolean;
};

type SurveyFormState = {
  ratingTangibility: string;
  ratingReliability: string;
  ratingResponsiveness: string;
  ratingAssurance: string;
  ratingEmpathy: string;
  overallRating: string;
  comment: string;
};

const initialFormState: SurveyFormState = {
  ratingTangibility: "",
  ratingReliability: "",
  ratingResponsiveness: "",
  ratingAssurance: "",
  ratingEmpathy: "",
  overallRating: "",
  comment: "",
};

const ratingOptions = ["1", "2", "3", "4", "5"];

const ratingFields: Array<{
  key: keyof Omit<SurveyFormState, "comment">;
  label: string;
  required?: boolean;
}> = [
  { key: "overallRating", label: "Overall rating / Penilaian Keseluruhan", required: true },
  { key: "ratingTangibility", label: "Tangibility / Bukti Fisik" },
  { key: "ratingReliability", label: "Reliability / Keandalan" },
  { key: "ratingResponsiveness", label: "Responsiveness / Daya Tanggap" },
  { key: "ratingAssurance", label: "Assurance / Jaminan" },
  { key: "ratingEmpathy", label: "Empathy / Empati" },
];

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function toPayloadValue(value: string) {
  return value ? Number(value) : null;
}

export function StudentSurveyPage() {
  const [data, setData] = useState<SurveyRequestsResponse | null>(null);
  const [expandedId, setExpandedId] = useState("");
  const [formState, setFormState] = useState(initialFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadSurveyRequests() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/student/surveys/requests");
      const body = (await response.json().catch(() => null)) as {
        data?: SurveyRequestsResponse;
        error?: string;
      } | null;

      if (!response.ok || !body?.data) {
        setError(body?.error ?? "Daftar survei gagal dimuat.");
        return;
      }

      setData(body.data);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadSurveyRequests();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function updateField(key: keyof SurveyFormState, value: string) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleForm(requestId: string) {
    setError("");
    setMessage("");
    setFormState(initialFormState);
    setExpandedId((current) => (current === requestId ? "" : requestId));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
    request: StudentSurveyRequest
  ) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!formState.overallRating) {
      setError("Rating keseluruhan wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/student/surveys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceSlug: request.serviceSlug,
          requestId: request.id,
          overallRating: Number(formState.overallRating),
          ratingTangibility: toPayloadValue(formState.ratingTangibility),
          ratingReliability: toPayloadValue(formState.ratingReliability),
          ratingResponsiveness: toPayloadValue(formState.ratingResponsiveness),
          ratingAssurance: toPayloadValue(formState.ratingAssurance),
          ratingEmpathy: toPayloadValue(formState.ratingEmpathy),
          comment: formState.comment,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(body?.error ?? "Survei kepuasan gagal dikirim.");
        return;
      }

      setMessage("Survei kepuasan berhasil dikirim.");
      setExpandedId("");
      setFormState(initialFormState);
      await loadSurveyRequests();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="border-[#EAE2D4] shadow-sm">
        <CardContent className="py-8 text-sm text-[#7A6A5C]">
          <div className="flex items-center justify-center gap-2">
            <div className="size-4 animate-spin rounded-full border-2 border-[#EE1C25]/20 border-t-[#EE1C25]" />
            Memuat daftar survei...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-[#EAE2D4] shadow-sm">
        <CardContent className="grid gap-4 py-8">
          <p className="text-sm text-[#7A6A5C]">
            Daftar survei belum dapat dimuat.
          </p>
          {error ? <p className="text-sm text-[#EE1C25]">{error}</p> : null}
          <Button
            type="button"
            variant="outline"
            onClick={loadSurveyRequests}
            className="border-[#DDD5C3] text-[#6B5E52] hover:border-[#EE1C25] hover:text-[#EE1C25] hover:bg-[#EE1C25]/5"
          >
            Coba Lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalCompletedRequests = data.pending.length + data.submitted.length;

  return (
    <div className="space-y-6">
      {/* Alert / Error / Success Messages */}
      {message ? (
        <div className="rounded-xl border border-[#EE1C25]/20 bg-[#EE1C25]/5 px-4 py-3 text-sm text-[#18130E]">
          <span className="font-medium">✓</span> {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-[#EE1C25]/30 bg-[#EE1C25]/10 px-4 py-3 text-sm text-[#EE1C25]">
          <span className="font-medium">✗</span> {error}
        </div>
      ) : null}

      {/* Table not available warning */}
      {!data.tableAvailable ? (
        <Card className="border-[#EAE2D4] shadow-sm">
          <CardContent className="py-6 text-sm text-[#7A6A5C]">
            Table survei belum tersedia. Jalankan migration
            002_create_ult_service_surveys.sql.
          </CardContent>
        </Card>
      ) : null}

      {/* PENDING SURVEYS */}
      <Card className="border-[#EAE2D4] shadow-sm overflow-hidden">
        <CardHeader className="px-6 pt-6 pb-2 sm:px-8">
          <CardTitle className="text-xl font-black tracking-tight text-[#18130E] sm:text-2xl">
            Menunggu Survei
          </CardTitle>
          <CardDescription className="text-[#7A6A5C]">
            Pengajuan selesai yang belum diberi survei.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 sm:px-8">
          {data.pending.length === 0 ? (
            <div className="rounded-xl border border-[#F5F0E8] bg-[#F7F3EA]/30 px-4 py-6 text-center text-sm text-[#7A6A5C]">
              {totalCompletedRequests === 0
                ? "Belum ada layanan selesai yang dapat disurvei."
                : "Semua layanan selesai sudah diberi survei. Terima kasih atas masukannya."}
            </div>
          ) : (
            <div className="space-y-4">
              {data.pending.map((request) => (
                <div
                  key={`${request.serviceSlug}-${request.id}`}
                  className="rounded-xl border border-[#EAE2D4] bg-white p-4 transition-all hover:border-[#EE1C25]/30 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#18130E]">
                        {request.serviceTitle}
                      </p>
                      <p className="mt-1 text-sm text-[#7A6A5C]">
                        {formatDate(request.requestDate)}
                      </p>
                      <Badge
                        variant="secondary"
                        className="mt-2 bg-[#F7F3EA] text-[#6B5E52] hover:bg-[#F7F3EA]"
                      >
                        {request.statusLabel}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant={expandedId === request.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleForm(request.id)}
                      className={
                        expandedId === request.id
                          ? "bg-[#EE1C25] hover:bg-[#C41720] text-white"
                          : "border-[#DDD5C3] text-[#6B5E52] hover:border-[#EE1C25] hover:text-[#EE1C25] hover:bg-[#EE1C25]/5"
                      }
                    >
                      {expandedId === request.id ? "Tutup Form" : "Isi Survei"}
                    </Button>
                  </div>

                  {expandedId === request.id ? (
                    <form
                      className="mt-6 space-y-5 border-t border-[#EAE2D4] pt-5"
                      onSubmit={(event) => handleSubmit(event, request)}
                    >
                      {/* KETERANGAN SKALA RATING */}
                      <div className="rounded-xl border border-[#EAE2D4] bg-[#F7F3EA]/40 p-3 text-xs text-[#6B5E52]">
                        <p className="font-semibold text-[#18130E] mb-1">
                          Keterangan Skala Rating:
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:flex sm:flex-wrap sm:gap-6">
                          <span>
                            <strong>1</strong> = Sangat Buruk
                          </span>
                          <span>
                            <strong>2</strong> = Buruk
                          </span>
                          <span>
                            <strong>3</strong> = Cukup
                          </span>
                          <span>
                            <strong>4</strong> = Baik
                          </span>
                          <span>
                            <strong>5</strong> = Sangat Baik
                          </span>
                        </div>
                      </div>

                      {/* TABEL / MATRIKS RATING */}
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[500px] border-collapse text-left text-sm">
                          <thead>
                            <tr className="border-b border-[#EAE2D4] text-[#18130E]">
                              <th className="py-2 px-3 font-semibold w-1/2">
                                Faktor Penilaian
                              </th>
                              {ratingOptions.map((num) => (
                                <th
                                  key={num}
                                  className="py-2 px-2 text-center font-bold w-[10%]"
                                >
                                  {num}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EAE2D4]/60">
                            {ratingFields.map((field) => (
                              <tr
                                key={field.key}
                                className="hover:bg-[#F7F3EA]/30 transition-colors"
                              >
                                <td className="py-2 px-3 font-medium text-[#18130E]">
                                  {field.label}
                                  {field.required ? (
                                    <span className="text-[#EE1C25]"> *</span>
                                  ) : (
                                    <span className="text-[#A0917F] font-normal text-xs block sm:inline sm:ml-1">
                                      (opsional)
                                    </span>
                                  )}
                                </td>
                                {ratingOptions.map((option) => {
                                  const isChecked =
                                    formState[field.key] === option;
                                  return (
                                    <td
                                      key={option}
                                      className="py-2 px-2 text-center"
                                    >
                                      <label className="inline-flex items-center justify-center cursor-pointer p-1 rounded-full hover:bg-[#EE1C25]/5">
                                        <input
                                          type="radio"
                                          name={`${request.id}-${field.key}`}
                                          value={option}
                                          checked={isChecked}
                                          onChange={(e) =>
                                            updateField(field.key, e.target.value)
                                          }
                                          required={field.required}
                                          className="size-4 accent-[#EE1C25] cursor-pointer"
                                        />
                                      </label>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* BAGIAN KOMENTAR */}
                      <div className="space-y-1.5">
                        <Label
                          htmlFor={`${request.id}-comment`}
                          className="text-sm font-medium text-[#18130E]"
                        >
                          Komentar
                        </Label>
                        <Textarea
                          id={`${request.id}-comment`}
                          maxLength={500}
                          value={formState.comment}
                          onChange={(event) =>
                            updateField("comment", event.currentTarget.value)
                          }
                          placeholder="Tulis masukan tambahan"
                          className="min-h-[100px] rounded-xl border-[#DDD5C3] bg-white text-[#18130E] placeholder:text-[#A0917F] focus-visible:border-[#EE1C25]/50 focus-visible:ring-1 focus-visible:ring-[#EE1C25]/30"
                        />
                        <p className="text-sm text-[#7A6A5C]">
                          {formState.comment.length}/500 karakter
                        </p>
                      </div>

                      {/* TOMBOL SUBMIT */}
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#EE1C25] hover:bg-[#C41720] text-white font-semibold shadow-sm transition-all hover:shadow-md"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                            Mengirim...
                          </>
                        ) : (
                          "Kirim Survei"
                        )}
                      </Button>
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SUBMITTED SURVEYS */}
      <Card className="border-[#EAE2D4] shadow-sm overflow-hidden">
        <CardHeader className="px-6 pt-6 pb-2 sm:px-8">
          <CardTitle className="text-xl font-black tracking-tight text-[#18130E] sm:text-2xl">
            Survei Sudah Diisi
          </CardTitle>
          <CardDescription className="text-[#7A6A5C]">
            Pengajuan selesai yang sudah memiliki respons survei.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 sm:px-8">
          {data.submitted.length === 0 ? (
            <div className="rounded-xl border border-[#F5F0E8] bg-[#F7F3EA]/30 px-4 py-6 text-center text-sm text-[#7A6A5C]">
              Belum ada survei yang sudah diisi.
            </div>
          ) : (
            <div className="space-y-3">
              {data.submitted.map((request) => (
                <div
                  key={`${request.serviceSlug}-${request.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EAE2D4] bg-white p-4 transition-all hover:border-[#EE1C25]/30 hover:shadow-md"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#18130E]">
                      {request.serviceTitle}
                    </p>
                    <p className="mt-1 text-sm text-[#7A6A5C]">
                      {formatDate(request.requestDate)}
                    </p>
                  </div>
                  <Badge className="bg-[#EE1C25]/10 text-[#EE1C25] hover:bg-[#EE1C25]/15 border-0">
                    ✓ Sudah Diisi
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}