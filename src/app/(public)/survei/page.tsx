import Link from "next/link";
import { getServerSession } from "next-auth";
import { 
  ClipboardCheck, 
  ClipboardList,
  BarChart3,
  Users,
  Star,
  CheckCircle2,
  FileSpreadsheet,
  ThumbsUp,
  TrendingUp,
  ListChecks,
  FileText
} from "lucide-react";

import { StudentSurveyPage } from "@/components/student/student-survey-page";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { isRole } from "@/lib/roles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ============================================
// SERVER COMPONENT
// ============================================
export default async function SurveiPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user.role;

  return (
    <div className="relative w-full bg-[#FEFDF9]">
      <main data-testid="survey-page" className="relative bg-[#FEFDF9]">
        <DecorativeAnimationStyles />

        {/* HERO SECTION */}
        <section className="hero-sec relative overflow-hidden border-b border-[#EAE2D4] bg-gradient-to-b from-[#F7F3EA] to-[#FEFDF9] px-4 pb-4 pt-30 sm:px-6 sm:pt-34 md:pt-38 lg:px-8 lg:pb-14 lg:pt-30">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, #C4B89A1A 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-[#EE1C25]/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-[#FCB71B]/5 blur-3xl"
          />

          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-start gap-8 lg:flex-row lg:gap-12">
            <div className="w-full lg:flex-1">
              <h1 className="hero-title mt-3 text-left text-[2rem] font-black leading-tight tracking-tight text-[#18130E] sm:text-[2.5rem] md:text-[2.8rem] lg:text-[3rem]">
                Survei Kepuasan Layanan
              </h1>

              <div className="editorial-underline flex justify-start">
                <SectionUnderline />
              </div>

              <p className="hero-desc mt-4 text-left text-base leading-7 text-[#7A6A5C] sm:text-lg sm:leading-8 md:max-w-2xl lg:max-w-xl">
                Menyediakan sarana evaluasi bagi pengguna layanan untuk memberikan penilaian 
                terhadap kualitas pelayanan yang telah diterima. Hasil survei digunakan sebagai 
                bahan perbaikan dan peningkatan mutu layanan secara berkelanjutan di lingkungan 
                ULT FMIPA Unpad.
              </p>
            </div>

            <div className="hero-decoration flex-shrink-0">
              <HeroDecoration />
            </div>
          </div>
        </section>

        {/* MARQUEE STRIP DIVIDER */}
        <MarqueeStrip />

        {/* CONTENT SECTION */}
        <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          {isRole(role, "MAHASISWA") ? (
            <StudentSurveyPage />
          ) : isRole(role, "ADMIN") ? (
            <AdminSurveyCard />
          ) : isRole(role, "STAFF") ? (
            <StaffSurveyCard />
          ) : (
            <GuestSurveyCard />
          )}
        </section>
      </main>
    </div>
  );
}

// ============================================
// KOMPONEN REUSEABLE
// ============================================

function SectionUnderline({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 220 18"
      className={`mt-3 h-4 w-40 text-[#EE1C25] ${className}`}
      fill="none"
    >
      <path
        d="M4 12 C48 2, 88 17, 132 8 S196 5, 216 11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}

function DecorativeAnimationStyles() {
  return (
    <style>{`
      @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .animate-spin-slow { animation: spin-slow 25s linear infinite; }

      @keyframes spin-slow-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
      .animate-spin-slow-reverse { animation: spin-slow-reverse 30s linear infinite; }

      @keyframes float-icon { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-6px) scale(1.02); } }
      .animate-float-icon { animation: float-icon 3.5s ease-in-out infinite; }

      @keyframes float-dot-1 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-4px, -5px); } }
      .animate-float-dot-1 { animation: float-dot-1 4.5s ease-in-out infinite; }

      @keyframes float-dot-2 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(5px, 4px); } }
      .animate-float-dot-2 { animation: float-dot-2 4s ease-in-out infinite; }

      @keyframes float-dot-3 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-5px, 3px); } }
      .animate-float-dot-3 { animation: float-dot-3 4.2s ease-in-out infinite; }

      @keyframes float-dot-4 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(5px, -3px); } }
      .animate-float-dot-4 { animation: float-dot-4 3.6s ease-in-out infinite; }

      @keyframes float-dot-5 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-3px, 6px); } }
      .animate-float-dot-5 { animation: float-dot-5 4.8s ease-in-out infinite; }

      @keyframes float-dot-6 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(4px, -6px); } }
      .animate-float-dot-6 { animation: float-dot-6 3.9s ease-in-out infinite; }

      @keyframes fade-up { from { opacity: 0; transform: translateY(14px); filter: blur(6px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
      .fade-up { animation: fade-up 0.6s ease-out both; }

      @keyframes pulse-glow {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.05); }
      }
      .animate-pulse-glow {
        animation: pulse-glow 2.5s ease-in-out infinite;
      }

      @keyframes float-survey-form {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-8px) rotate(-2deg); }
      }
      .animate-float-survey-form {
        animation: float-survey-form 3.5s ease-in-out infinite;
      }

      @keyframes float-survey-results {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-8px) rotate(2deg); }
      }
      .animate-float-survey-results {
        animation: float-survey-results 3.5s ease-in-out infinite 0.2s;
      }

      @keyframes float-checklist {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-8px) rotate(-1.5deg); }
      }
      .animate-float-checklist {
        animation: float-checklist 4s ease-in-out infinite;
      }

      @media (prefers-reduced-motion: reduce) {
        .animate-spin-slow, .animate-spin-slow-reverse, .animate-float-icon,
        .animate-float-dot-1, .animate-float-dot-2, .animate-float-dot-3,
        .animate-float-dot-4, .animate-float-dot-5, .animate-float-dot-6,
        .fade-up, .animate-pulse-glow, .animate-float-survey-form,
        .animate-float-survey-results, .animate-float-checklist {
          animation: none;
        }
      }
    `}</style>
  );
}

function MarqueeStrip() {
  const items = ["SURVEI KEPUASAN", "EVALUASI LAYANAN", "FEEDBACK MAHASISWA", "PENINGKATAN MUTU"];
  const textItems = [...items, ...items, ...items, ...items, ...items];

  return (
    <section className="relative overflow-hidden border-y border-[#d8ceb6] bg-[#EAE4CA] py-4">
      <div className="flex w-max items-center gap-12 whitespace-nowrap informations-marquee-track">
        {textItems.map((item, idx) => (
          <span
            key={`${item}-${idx}`}
            className="text-sm font-black uppercase tracking-[0.34em] text-[#18130E]/45"
          >
            {item}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes informations-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .informations-marquee-track {
          animation: informations-marquee 34s linear infinite;
        }
      `}</style>
    </section>
  );
}

function HeroDecoration() {
  return (
    <div className="relative hidden lg:block">
      <div className="relative h-[280px] w-[280px]">
        {/* Outer ring */}
        <div className="absolute inset-0 animate-spin-slow">
          <div className="absolute inset-0 rounded-full border border-[#EE1C25]/8" />
          <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-[#EE1C25]/15" />
          <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#EE1C25]/15" />
          <div className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#EE1C25]/15" />
          <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#EE1C25]/15" />
        </div>

        {/* Middle ring */}
        <div className="absolute inset-[12%] animate-spin-slow-reverse">
          <div className="absolute inset-0 rounded-full border border-[#FCB71B]/8" />
          <div className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#FCB71B]/15" />
          <div className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#FCB71B]/15" />
          <div className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#FCB71B]/15" />
          <div className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#FCB71B]/15" />
        </div>

        {/* Center content - Survey Form */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative flex items-center gap-3">
            {/* Left Card - Checklist / Form */}
            <div className="relative h-32 w-24 animate-float-checklist">
              <div className="h-full w-full rounded-2xl border-2 border-[#EE1C25]/20 bg-gradient-to-br from-[#EE1C25]/5 to-white p-4 shadow-lg">
                <div className="flex items-center gap-1.5">
                  <ClipboardList className="size-4 text-[#EE1C25]" />
                  <span className="text-[8px] font-bold text-[#18130E]">SURVEI</span>
                </div>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3 text-[#EE1C25]/60" />
                    <div className="h-1 w-12 rounded-full bg-[#18130E]/10" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-3 rounded-full border border-[#DDD5C3]" />
                    <div className="h-1 w-10 rounded-full bg-[#18130E]/10" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-3 rounded-full border border-[#DDD5C3]" />
                    <div className="h-1 w-8 rounded-full bg-[#18130E]/10" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-3 rounded-full border border-[#DDD5C3]" />
                    <div className="h-1 w-11 rounded-full bg-[#18130E]/10" />
                  </div>
                </div>
                <Star className="absolute bottom-2 right-2 size-3 text-[#B98900]/30" strokeWidth={1.8} />
              </div>
            </div>

            {/* Divider */}
            <div className="h-32 w-0.5 rounded-full bg-gradient-to-b from-transparent via-[#EAE2D4] to-transparent" />

            {/* Right Card - Results / Analytics */}
            <div className="relative h-32 w-24 animate-float-survey-results">
              <div className="h-full w-full rounded-2xl border-2 border-[#FCB71B]/20 bg-gradient-to-br from-[#FCB71B]/5 to-white p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="rounded bg-[#EE1C25]/10 px-1.5 py-0.5 text-[7px] font-bold text-[#EE1C25]">
                    AKTIF
                  </div>
                  <BarChart3 className="size-3.5 text-[#EE1C25]/40" strokeWidth={2} />
                </div>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[7px] font-medium text-[#7A6A5C]">Sangat Puas</span>
                        <span className="text-[7px] font-bold text-[#18130E]">85%</span>
                      </div>
                      <div className="mt-0.5 h-1.5 w-full rounded-full bg-[#F7F3EA] overflow-hidden">
                        <div className="h-full w-[85%] rounded-full bg-[#EE1C25]" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[7px] font-medium text-[#7A6A5C]">Puas</span>
                        <span className="text-[7px] font-bold text-[#18130E]">62%</span>
                      </div>
                      <div className="mt-0.5 h-1.5 w-full rounded-full bg-[#F7F3EA] overflow-hidden">
                        <div className="h-full w-[62%] rounded-full bg-[#FCB71B]" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[7px] font-medium text-[#7A6A5C]">Cukup Puas</span>
                        <span className="text-[7px] font-bold text-[#18130E]">73%</span>
                      </div>
                      <div className="mt-0.5 h-1.5 w-full rounded-full bg-[#F7F3EA] overflow-hidden">
                        <div className="h-full w-[73%] rounded-full bg-[#7A6A5C]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating icons - Survey themed */}
        <div className="absolute -right-8 top-4 h-8 w-8 animate-float-dot-1">
          <CheckCircle2 className="size-5 text-[#EE1C25]/20" strokeWidth={1.5} />
        </div>
        <div className="absolute -left-8 bottom-8 h-8 w-8 animate-float-dot-2">
          <FileText className="size-5 text-[#FCB71B]/20" strokeWidth={1.5} />
        </div>
        <div className="absolute -right-5 bottom-14 h-6 w-6 animate-float-dot-3">
          <TrendingUp className="size-4 text-[#18130E]/12" strokeWidth={1.5} />
        </div>
        <div className="absolute -left-5 top-14 h-6 w-6 animate-float-dot-4">
          <ThumbsUp className="size-4 text-[#EE1C25]/12" strokeWidth={1.5} />
        </div>
        <div className="absolute left-1/2 -top-7 h-7 w-7 -translate-x-1/2 animate-float-dot-5">
          <FileSpreadsheet className="size-4.5 text-[#FCB71B]/14" strokeWidth={1.5} />
        </div>
        <div className="absolute left-1/2 -bottom-7 h-7 w-7 -translate-x-1/2 animate-float-dot-6">
          <ListChecks className="size-4.5 text-[#EE1C25]/14" strokeWidth={1.5} />
        </div>
        <div className="absolute top-1/2 -right-10 h-6 w-6 -translate-y-1/2 animate-float-dot-1">
          <ClipboardCheck className="size-4 text-[#EE1C25]/10" strokeWidth={1.5} />
        </div>
        <div className="absolute top-1/2 -left-10 h-6 w-6 -translate-y-1/2 animate-float-dot-2">
          <Users className="size-4 text-[#FCB71B]/10" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// KOMPONEN KARTU BERDASARKAN ROLE
// ============================================

function AdminSurveyCard() {
  return (
    <div className="fade-up">
      <Card className="border-[#EAE2D4] bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#EE1C25]/10 p-2.5">
              <ClipboardCheck className="size-6 text-[#EE1C25]" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-[#18130E]">
                Ringkasan Survei Admin
              </CardTitle>
              <CardDescription className="text-[#7A6A5C]">
                Admin dapat melihat ringkasan respons survei dari halaman
                khusus admin untuk evaluasi layanan.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button 
            asChild 
            className="bg-[#EE1C25] hover:bg-[#C4161E] text-white font-semibold"
          >
            <Link href="/admin/surveys">
              <BarChart3 className="mr-2 size-4" />
              Buka Ringkasan Survei
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StaffSurveyCard() {
  return (
    <div className="fade-up">
      <Card className="border-[#EAE2D4] bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#FCB71B]/10 p-2.5">
              <ClipboardCheck className="size-6 text-[#FCB71B]" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-[#18130E]">
                Ringkasan Survei Staff
              </CardTitle>
              <CardDescription className="text-[#7A6A5C]">
                Staff dapat melihat ringkasan respons survei dari halaman
                khusus staff untuk evaluasi layanan.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button 
            asChild 
            className="bg-[#FCB71B] hover:bg-[#E5A40F] text-[#18130E] font-semibold"
          >
            <Link href="/staff/surveys">
              <BarChart3 className="mr-2 size-4" />
              Buka Ringkasan Survei
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function GuestSurveyCard() {
  return (
    <div className="fade-up">
      <Card className="border-[#EAE2D4] bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#7A6A5C]/10 p-2.5">
              <ClipboardList className="size-6 text-[#7A6A5C]" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-[#18130E]">
                Survei Kepuasan Layanan
              </CardTitle>
              <CardDescription className="text-[#7A6A5C]">
                Login sebagai mahasiswa untuk mengisi survei dari layanan yang
                sudah selesai. Admin dan staff dapat melihat ringkasan survei
                setelah login.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button 
            asChild 
            className="bg-[#18130E] hover:bg-[#2D241E] text-white font-semibold"
          >
            <Link href="/login">
              <Users className="mr-2 size-4" />
              Login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
