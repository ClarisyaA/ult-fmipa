"use client";

import { FormEvent, useState } from "react";

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
import type { ServiceSurvey } from "@/lib/service-surveys";

type ServiceSurveyFormProps = {
  serviceSlug: string;
  requestId: string;
  initialSurvey: ServiceSurvey | null;
};

type RatingField =
  | "ratingTangibility"
  | "ratingReliability"
  | "ratingResponsiveness"
  | "ratingAssurance"
  | "ratingEmpathy"
  | "overallRating";

type SurveyFormState = Record<RatingField, string> & {
  comment: string;
};

const ratingOptions = ["1", "2", "3", "4", "5"];
const dimensionFields: Array<{
  key: RatingField;
  label: string;
  description: string;
  required?: boolean;
}> = [
  {
    key: "overallRating",
    label: "Rating keseluruhan",
    description: "Nilai umum untuk pengalaman layanan ini.",
    required: true,
  },
  {
    key: "ratingTangibility",
    label: "Tangibility",
    description: "Kejelasan fasilitas, dokumen, dan informasi layanan.",
  },
  {
    key: "ratingReliability",
    label: "Reliability",
    description: "Kesesuaian layanan dengan janji dan kebutuhan.",
  },
  {
    key: "ratingResponsiveness",
    label: "Responsiveness",
    description: "Kecepatan dan ketanggapan proses layanan.",
  },
  {
    key: "ratingAssurance",
    label: "Assurance",
    description: "Kepastian informasi dan rasa percaya terhadap layanan.",
  },
  {
    key: "ratingEmpathy",
    label: "Empathy",
    description: "Perhatian dan keramahan dalam membantu pemohon.",
  },
];

function toInitialState(survey: ServiceSurvey | null): SurveyFormState {
  return {
    ratingTangibility: survey?.ratingTangibility?.toString() ?? "",
    ratingReliability: survey?.ratingReliability?.toString() ?? "",
    ratingResponsiveness: survey?.ratingResponsiveness?.toString() ?? "",
    ratingAssurance: survey?.ratingAssurance?.toString() ?? "",
    ratingEmpathy: survey?.ratingEmpathy?.toString() ?? "",
    overallRating: survey?.overallRating.toString() ?? "",
    comment: survey?.comment ?? "",
  };
}

function toPayloadValue(value: string) {
  return value ? Number(value) : null;
}

export function ServiceSurveyForm({
  serviceSlug,
  requestId,
  initialSurvey,
}: ServiceSurveyFormProps) {
  const [formState, setFormState] = useState<SurveyFormState>(() =>
    toInitialState(initialSurvey)
  );
  const [savedSurvey, setSavedSurvey] = useState(initialSurvey);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function updateField(key: keyof SurveyFormState, value: string) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
          serviceSlug,
          requestId,
          ratingTangibility: toPayloadValue(formState.ratingTangibility),
          ratingReliability: toPayloadValue(formState.ratingReliability),
          ratingResponsiveness: toPayloadValue(formState.ratingResponsiveness),
          ratingAssurance: toPayloadValue(formState.ratingAssurance),
          ratingEmpathy: toPayloadValue(formState.ratingEmpathy),
          overallRating: Number(formState.overallRating),
          comment: formState.comment,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        data?: ServiceSurvey;
        error?: string;
      } | null;

      if (!response.ok || !body?.data) {
        setError(body?.error ?? "Survei kepuasan gagal disimpan.");
        return;
      }

      setSavedSurvey(body.data);
      setFormState(toInitialState(body.data));
      setMessage("Survei kepuasan berhasil disimpan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Isi Survei Kepuasan</CardTitle>
        <CardDescription>
          Survei ini terhubung ke pengajuan layanan yang sudah selesai.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {savedSurvey ? (
          <div className="mb-4 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            Survei sudah pernah dikirim. Anda masih dapat memperbarui jawaban.
          </div>
        ) : null}
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-3">
            {dimensionFields.map((field) => (
              <div
                key={field.key}
                className="grid gap-2 rounded-md border bg-background p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Label htmlFor={field.key}>
                      {field.label}
                      {field.required ? " *" : ""}
                    </Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {field.description}
                    </p>
                  </div>
                  <select
                    id={field.key}
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
              </div>
            ))}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="survey-comment">Komentar</Label>
            <Textarea
              id="survey-comment"
              maxLength={500}
              value={formState.comment}
              onChange={(event) => updateField("comment", event.currentTarget.value)}
              placeholder="Tulis masukan tambahan untuk layanan ini"
            />
            <p className="text-sm text-muted-foreground">
              {formState.comment.length}/500 karakter
            </p>
          </div>

          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {message}
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : savedSurvey ? "Perbarui Survei" : "Kirim Survei"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
