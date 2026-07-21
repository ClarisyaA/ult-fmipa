import { getServerSession } from "next-auth";

import { ServiceSuggestionForm } from "@/components/service-suggestions/service-suggestion-form";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ServiceSuggestionPage() {
  const session = await getServerSession(authOptions);
  const isStudent = session?.user.role === "student";

  return (
    <main className="bg-[#fbfaf7] px-4 py-16 text-[#18130e] sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-8">
        <section className="grid gap-4">
          <p
            aria-hidden="true"
            className="invisible pointer-events-none select-none text-xs font-black uppercase tracking-[0.22em] text-[#0f5b45]"
          >
            Usulan Layanan
          </p>
          <div className="grid gap-3">
            <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">
              Sampaikan layanan yang Anda butuhkan di ULT FMIPA.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-[#6f665b]">
              Masukan ini membantu ULT FMIPA memetakan kebutuhan mahasiswa dan
              meningkatkan layanan yang sudah berjalan.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#e8dece] bg-white shadow-sm">
          <div className="border-b border-[#eee5d7] bg-[#fffdf9] px-5 py-4 sm:px-7">
            <h2 className="text-xl font-black">Form Usulan Layanan</h2>
            <p className="mt-1 text-sm text-[#786f63]">
              Isi data berikut dengan lengkap agar usulan dapat ditinjau oleh
              admin atau staff ULT.
            </p>
          </div>
          <div className="p-5 sm:p-7">
            <ServiceSuggestionForm
              initialNama={isStudent ? (session.user.name ?? "") : ""}
              initialNpm={isStudent ? (session.user.npm ?? "") : ""}
              lockNpm={Boolean(isStudent && session.user.npm)}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
