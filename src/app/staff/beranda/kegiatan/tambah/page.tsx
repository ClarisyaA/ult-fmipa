import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { HomeActivityForm } from "@/components/home-activities/home-activity-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function StaffTambahHomeActivityPage() {
  return (
    <div
      className="-m-4 min-h-full bg-[#f8f2ea] text-[#1f2922] sm:-m-5 lg:-m-6"
      style={{
        backgroundImage: [
          "radial-gradient(ellipse 72% 30% at 55% -8%, transparent 67%, rgba(198,184,160,0.20) 67.15%, transparent 67.45%)",
          "radial-gradient(ellipse 62% 28% at 75% 6%, transparent 63%, rgba(205,192,170,0.18) 63.15%, transparent 63.45%)",
          "radial-gradient(ellipse 48% 22% at 92% 18%, transparent 60%, rgba(201,187,164,0.20) 60.15%, transparent 60.45%)",
          "radial-gradient(circle at 74% 12%, rgba(247,238,224,0.92), transparent 34%)",
          "radial-gradient(circle at 100% 0%, rgba(243,230,211,0.48), transparent 30%)",
          "linear-gradient(180deg, #fbf8f2 0%, #f8f2ea 38%, #f5ecdf 100%)",
        ].join(", "),
        backgroundAttachment: "fixed",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <div className="relative z-0 overflow-hidden bg-transparent px-5 pb-10 pt-5 text-[#173d2d] sm:px-7 lg:px-8">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Button
              asChild
              variant="ghost"
              className="-ml-2 mb-3 h-8 w-fit rounded-md px-2 text-[11px] font-semibold text-[#536058] hover:bg-[#f6f1e8] hover:text-[#0f3d2e]"
            >
              <Link href="/staff/beranda/kegiatan">
                <ArrowLeft className="size-3.5" />
                Kembali
              </Link>
            </Button>
            <h1 className="text-lg font-semibold tracking-normal sm:text-xl">
              Tambah Kegiatan Mahasiswa
            </h1>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#566258]">
              Tambahkan kegiatan mahasiswa yang akan ditampilkan pada carousel
              homepage sesuai urutan.
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-6 grid max-w-[1320px] gap-3 px-4 pb-6 sm:px-6 lg:px-7">
        <section className="overflow-hidden rounded-lg border border-[#e3d9ca] bg-white shadow-[0_2px_10px_rgba(47,38,20,0.08)]">
          <div className="border-b border-[#eee6d9] bg-[#fffdf9] px-4 py-4 sm:px-5">
            <h2 className="text-sm font-semibold text-[#173d2d]">
              Form Kegiatan
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-[#7a7166]">
              Lengkapi informasi kegiatan, gambar, status, dan urutan tampil.
            </p>
          </div>
          <div className="px-4 py-4 sm:px-5 sm:py-5">
            <HomeActivityForm rolePrefix="staff" mode="create" />
          </div>
        </section>
      </div>
    </div>
  );
}
