"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Mail,
  ShieldCheck,
  UploadCloud,
  UserCheck,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ServiceFlowType } from "./service-flow-config";

type PublicTemplateLink = {
  label: string;
  url: string;
  isActive: boolean;
};

/* ================================================================
 * KONSTANTA
 * ================================================================ */

const PERPUS_URL = "https://perpustakaan.fmipa.unpad.ac.id";
const SBAK_FORM_URL = "https://sbak.unpad.ac.id/form";
const AUTHENTICATED_STUDENT_EMAIL = "nama.mahasiswa@mail.unpad.ac.id";

/* ================================================================
 * MAIN COMPONENT
 * ================================================================ */

interface ServiceFlowProps {
  slug: string;
  flow: ServiceFlowType;
  templateLinks?: {
    scholarshipRecommendation?: PublicTemplateLink;
  };
}

export function ServiceFlow({ slug, flow, templateLinks }: ServiceFlowProps) {
  switch (flow) {
    case "perpus":
      return <PerpusFlow />;
    case "magang-sik":
      return <MagangSikFlow />;
    case "template":
      return (
        <TemplateFlow
          slug={slug}
          scholarshipTemplateLink={templateLinks?.scholarshipRecommendation}
        />
      );
    case "pengiriman":
      return <PengirimanFlow />;
    default:
      return <DefaultFlow />;
  }
}

/* ================================================================
 * 1. PERPUS - Perpustakaan FMIPA
 * ================================================================ */

function PerpusFlow() {
  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-[#E8DECE] bg-[#FAF7EF] p-4 text-sm text-[#6B5E52]">
        <FileText className="mt-0.5 size-4 shrink-0 text-[#EE1C25]" />
        <p>
          Layanan ini terintegrasi dengan sistem Perpustakaan FMIPA. 
          Semua data koleksi, status peminjaman, dan riwayat pustaka 
          dapat diakses secara real-time di situs resmi mereka.
        </p>
      </div>

      <Button asChild size="lg" className="w-full bg-[#EE1C25] hover:bg-[#EE1C25]/90">
        <a href={PERPUS_URL} target="_blank" rel="noopener noreferrer">
          Buka Perpustakaan FMIPA
          <ExternalLink className="size-4 ml-2" />
        </a>
      </Button>
    </div>
  );
}

/* ================================================================
 * 2. MAGANG-SIK - Magang & SIK
 * ================================================================ */

interface SikStep {
  id: string;
  title: string;
  description: string;
  icon: typeof UserCheck;
}

const SIK_STEPS: SikStep[] = [
  {
    id: "ajuan",
    title: "Ajukan bersama Koordinator",
    description: "Mahasiswa mengajukan permohonan magang/SIK bersama koordinator program studi. Pastikan semua dokumen awal sudah disiapkan.",
    icon: UserCheck,
  },
  {
    id: "verifikasi",
    title: "Verifikasi & Upload Surat Izin",
    description: "Upload surat izin resmi yang sudah ditandatangani. Berkas akan diverifikasi oleh tim ULT FMIPA sebelum diproses lebih lanjut.",
    icon: ShieldCheck,
  },
  {
    id: "sbak",
    title: "Upload ke SBAK",
    description: "Setelah diverifikasi, berkas pengajuan akan diteruskan dan diunggah ke sistem SBAK untuk diproses lebih lanjut.",
    icon: UploadCloud,
  },
  {
    id: "proses",
    title: "Diproses SBAK",
    description: "Pengajuan sedang diproses oleh pihak SBAK sesuai dengan Standar Layanan (SLA) yang berlaku.",
    icon: Clock,
  },
  {
    id: "eksternal",
    title: "Form SBAK (Eksternal)",
    description: "Tahap akhir dilakukan di luar sistem FMIPA. Mahasiswa akan diarahkan ke form resmi SBAK.",
    icon: ExternalLink,
  },
];

function MagangSikFlow() {
  const [activeStep, setActiveStep] = useState(0);
  const [suratIzin, setSuratIzin] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSuratIzin(file);
  };

  const isVerificationStep = SIK_STEPS[activeStep].id === "verifikasi";
  const isExternalStep = SIK_STEPS[activeStep].id === "eksternal";

  return (
    <div className="mt-4 space-y-4">
      {/* Stepper */}
      <ol className="flex gap-2 overflow-x-auto pb-2">
        {SIK_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === activeStep;
          const isDone = index < activeStep;

          return (
            <li key={step.id} className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveStep(index)}
                aria-current={isActive}
                className={[
                  "flex size-10 items-center justify-center rounded-full border-2 transition-all duration-200",
                  isActive
                    ? "border-[#EE1C25] bg-[#EE1C25] text-white shadow-md shadow-[#EE1C25]/20"
                    : isDone
                      ? "border-[#EE1C25]/40 bg-[#EE1C25]/10 text-[#EE1C25]"
                      : "border-[#DDD5C3] bg-white text-[#A0917F] hover:border-[#EE1C25]/40",
                ].join(" ")}
              >
                {isDone ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <Icon className="size-4" />
                )}
              </button>
              {index < SIK_STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-4 rounded-full transition-colors duration-200 sm:w-8 ${
                    isDone ? "bg-[#EE1C25]/40" : "bg-[#E8DECE]"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Detail tahap */}
      <div className="rounded-xl border border-[#E8DECE] bg-[#FAF7EF] p-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#EE1C25]">
          Tahap {activeStep + 1} dari {SIK_STEPS.length}
        </span>
        <h3 className="mt-1 text-base font-bold text-[#18130E]">
          {SIK_STEPS[activeStep].title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-[#6B5E52]">
          {SIK_STEPS[activeStep].description}
        </p>

        {/* Upload surat izin */}
        {isVerificationStep && (
          <div className="mt-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {suratIzin ? (
              <div className="flex items-center justify-between rounded-lg border border-[#EE1C25]/30 bg-white px-3 py-2 text-sm">
                <span className="flex items-center gap-2 truncate font-medium text-[#18130E]">
                  <FileText className="size-4 shrink-0 text-[#EE1C25]" />
                  <span className="truncate">{suratIzin.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSuratIzin(null)}
                  className="text-[#A0917F] hover:text-[#EE1C25]"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-dashed border-[#DDD5C3] text-[#6B5E52] hover:border-[#EE1C25]/50 hover:text-[#EE1C25]"
              >
                <UploadCloud className="size-4 mr-2" />
                Upload Surat Izin
              </Button>
            )}
          </div>
        )}

        {/* Tombol ke form SBAK */}
        {isExternalStep && (
          <Button asChild className="mt-3 w-full bg-[#EE1C25] hover:bg-[#EE1C25]/90">
            <a href={SBAK_FORM_URL} target="_blank" rel="noopener noreferrer">
              Lanjut ke Form SBAK
              <ExternalLink className="size-4 ml-2" />
            </a>
          </Button>
        )}
      </div>

      {/* Navigasi */}
      <div className="flex justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={activeStep === 0}
          onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
        >
          Sebelumnya
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={activeStep === SIK_STEPS.length - 1}
          onClick={() =>
            setActiveStep((s) => Math.min(SIK_STEPS.length - 1, s + 1))
          }
        >
          Berikutnya
        </Button>
      </div>
    </div>
  );
}

/* ================================================================
 * 3. TEMPLATE - Surat dengan template
 * ================================================================ */

function TemplateFlow({
  slug,
  scholarshipTemplateLink,
}: {
  slug: string;
  scholarshipTemplateLink?: PublicTemplateLink;
}) {
  const isScholarshipService = slug === "rekomendasi-beasiswa";
  const activeScholarshipLink =
    isScholarshipService && scholarshipTemplateLink?.isActive
      ? scholarshipTemplateLink
      : null;

  if (isScholarshipService) {
    return (
      <div className="mt-4 space-y-4">
        <div className="flex items-center gap-4 rounded-xl border border-[#E8DECE] bg-[#FAF7EF] p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EE1C25]/8">
            <FileText className="size-5 text-[#EE1C25]" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#18130E]">
              {scholarshipTemplateLink?.label ?? "Template Surat Rekomendasi Beasiswa"}
            </p>
            <p className="text-xs text-[#A0917F]">
              Google Docs/Drive · Dibuka di tab baru
            </p>
          </div>
        </div>

        {activeScholarshipLink ? (
          <Button asChild size="lg" className="w-full bg-[#EE1C25] hover:bg-[#EE1C25]/90">
            <a
              href={activeScholarshipLink.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-4 mr-2" />
              Buka Template Rekomendasi Beasiswa
            </a>
          </Button>
        ) : (
          <p className="rounded-xl border border-[#E8DECE] bg-[#FAF7EF] p-4 text-sm text-[#6B5E52]">
            Link template Rekomendasi Beasiswa sedang nonaktif. Silakan hubungi ULT FMIPA.
          </p>
        )}

        <ol className="space-y-2 text-sm text-[#6B5E52]">
          <li className="flex gap-2">
            <span className="font-bold text-[#EE1C25]">1.</span>
            Buka atau salin template dari Google Docs.
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-[#EE1C25]">2.</span>
            Isi dokumen sesuai kebutuhan beasiswa.
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-[#EE1C25]">3.</span>
            Unggah dokumen yang sudah dilengkapi pada bagian Dokumen Pendukung.
          </li>
        </ol>
      </div>
    );
  }

  return <DefaultFlow />;
}

/* ================================================================
 * 4. PENGIRIMAN - Kirim dokumen ke mahasiswa
 * ================================================================ */

type EmailOption = "terdaftar" | "pribadi";

function PengirimanFlow() {
  const [emailOption, setEmailOption] = useState<EmailOption>("terdaftar");
  const [customEmail, setCustomEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const targetEmail = useMemo(
    () => (emailOption === "terdaftar" ? AUTHENTICATED_STUDENT_EMAIL : customEmail),
    [emailOption, customEmail]
  );

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail);
  const canSubmit = Boolean(file) && isValidEmail;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    if (selected && selected.type !== "application/pdf") {
      event.target.value = "";
      return;
    }
    setFile(selected);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setStatus("sent");
  };

  if (status === "sent") {
    return (
      <div className="mt-4">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-[#EE1C25]/20 bg-[#EE1C25]/5 p-6 text-center">
          <CheckCircle2 className="size-8 text-[#EE1C25]" />
          <p className="text-sm text-[#6B5E52]">
            Dokumen berhasil dikirim ke{" "}
            <span className="font-bold text-[#18130E]">{targetEmail}</span>
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setStatus("idle");
              setFile(null);
            }}
          >
            Kirim Dokumen Lain
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Pilihan email */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#FAF7EF] p-1.5">
        {(
          [
            { key: "terdaftar", label: "📧 Email Terdaftar" },
            { key: "pribadi", label: "✏️ Email Pribadi" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setEmailOption(opt.key)}
            className={[
              "rounded-lg px-3 py-2 text-sm font-bold transition-all duration-200",
              emailOption === opt.key
                ? "bg-white text-[#EE1C25] shadow-sm"
                : "text-[#A0917F] hover:text-[#6B5E52]",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Input email */}
      {emailOption === "terdaftar" ? (
        <div className="flex items-center gap-3 rounded-lg border border-[#E8DECE] bg-white px-3 py-2 text-sm">
          <Mail className="size-4 text-[#EE1C25]" />
          <span className="font-medium text-[#18130E]">
            {AUTHENTICATED_STUDENT_EMAIL}
          </span>
          <span className="ml-auto text-xs text-[#A0917F]">Email aktif</span>
        </div>
      ) : (
        <Input
          type="email"
          value={customEmail}
          onChange={(e) => setCustomEmail(e.target.value)}
          placeholder="Masukkan email pribadi"
          className="h-10 rounded-lg border-[#DDD5C3] focus-visible:border-[#EE1C25]/50 focus-visible:ring-1 focus-visible:ring-[#EE1C25]/30"
        />
      )}

      {/* Upload PDF */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      {file ? (
        <div className="flex items-center justify-between rounded-lg border border-[#EE1C25]/30 bg-white px-3 py-2 text-sm">
          <span className="flex items-center gap-2 truncate font-medium text-[#18130E]">
            <FileText className="size-4 shrink-0 text-[#EE1C25]" />
            <span className="truncate">{file.name}</span>
          </span>
          <button
            type="button"
            onClick={() => setFile(null)}
            className="text-[#A0917F] hover:text-[#EE1C25]"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-dashed border-[#DDD5C3] text-[#6B5E52] hover:border-[#EE1C25]/50 hover:text-[#EE1C25]"
        >
          <UploadCloud className="size-4 mr-2" />
          Pilih Berkas PDF
        </Button>
      )}

      <Button
        type="button"
        size="lg"
        disabled={!canSubmit}
        onClick={handleSubmit}
        className="w-full bg-[#EE1C25] hover:bg-[#EE1C25]/90 disabled:opacity-40"
      >
        Kirim Dokumen
      </Button>
    </div>
  );
}

/* ================================================================
 * 5. DEFAULT - Fallback
 * ================================================================ */

function DefaultFlow() {
  return null;
}
