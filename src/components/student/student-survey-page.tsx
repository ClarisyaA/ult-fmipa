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
  { key: "overallRating", label: "Overall rating", required: true },
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
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Memuat daftar survei...
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="grid gap-3 py-6">
          <p className="text-sm text-muted-foreground">
            Daftar survei belum dapat dimuat.
          </p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="button" variant="outline" onClick={loadSurveyRequests}>
            Coba Lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalCompletedRequests = data.pending.length + data.submitted.length;

  return (
    <div className="grid gap-6">
      {!data.tableAvailable ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Table survei belum tersedia. Jalankan migration
            002_create_ult_service_surveys.sql.
          </CardContent>
        </Card>
      ) : null}

      {message ? (
        <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Menunggu Survei</CardTitle>
          <CardDescription>
            Pengajuan selesai yang belum diberi survei.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {data.pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {totalCompletedRequests === 0
                ? "Belum ada layanan selesai yang dapat disurvei."
                : "Semua layanan selesai sudah diberi survei. Terima kasih atas masukannya."}
            </p>
          ) : (
            data.pending.map((request) => (
              <div key={`${request.serviceSlug}-${request.id}`} className="rounded-md border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{request.serviceTitle}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(request.requestDate)}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      {request.statusLabel}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant={expandedId === request.id ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => toggleForm(request.id)}
                  >
                    Isi Survei
                  </Button>
                </div>

                {expandedId === request.id ? (
                  <form
                    className="mt-4 grid gap-4 border-t pt-4"
                    onSubmit={(event) => handleSubmit(event, request)}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      {ratingFields.map((field) => (
                        <div key={field.key} className="grid gap-2">
                          <Label htmlFor={`${request.id}-${field.key}`}>
                            {field.label}
                            {field.required ? " *" : ""}
                          </Label>
                          <select
                            id={`${request.id}-${field.key}`}
                            className="h-8 rounded-md border bg-background px-2 text-sm"
                            value={formState[field.key]}
                            onChange={(event) =>
                              updateField(field.key, event.currentTarget.value)
                            }
                            required={field.required}
                          >
                            <option value="">Pilih</option>
                            {ratingOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`${request.id}-comment`}>Komentar</Label>
                      <Textarea
                        id={`${request.id}-comment`}
                        maxLength={500}
                        value={formState.comment}
                        onChange={(event) =>
                          updateField("comment", event.currentTarget.value)
                        }
                        placeholder="Tulis masukan tambahan"
                      />
                      <p className="text-sm text-muted-foreground">
                        {formState.comment.length}/500 karakter
                      </p>
                    </div>

                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Mengirim..." : "Kirim Survei"}
                    </Button>
                  </form>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Survei Sudah Diisi</CardTitle>
          <CardDescription>
            Pengajuan selesai yang sudah memiliki respons survei.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {data.submitted.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada survei yang sudah diisi.
            </p>
          ) : (
            data.submitted.map((request) => (
              <div
                key={`${request.serviceSlug}-${request.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{request.serviceTitle}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(request.requestDate)}
                  </p>
                </div>
                <Badge variant="secondary">Sudah Diisi</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
