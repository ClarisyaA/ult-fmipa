import Image from "next/image";
import { Suspense } from "react";

import { LoginForm } from "@/app/login/login-form";

function getPausMode() {
  return process.env.PAUS_MODE === "legacy" ? "legacy" : "modern";
}

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh bg-white lg:h-dvh lg:grid-cols-[1.45fr_1fr] lg:overflow-hidden">
      <section className="animate-login-media-in relative hidden h-dvh overflow-hidden bg-slate-950 lg:block">
        <Image
          src="/gedung-fmipa.svg"
          alt="Gedung FMIPA Universitas Padjadjaran"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.12)_0%,rgba(15,23,42,0.28)_46%,rgba(15,23,42,0.76)_100%)]" />
      </section>

      <section className="animate-login-panel-in flex min-h-dvh min-w-0 flex-col overflow-x-hidden bg-white px-4 py-5 min-[400px]:px-6 min-[400px]:py-8 sm:px-10 lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:px-12 lg:py-4 xl:px-16">
        <div className="mb-5 flex items-center gap-3 min-[400px]:mb-8 lg:hidden">
          <div className="flex size-11 items-center justify-center rounded-xl border border-red-100 bg-white shadow-sm">
            <Image
              src="/sbak.svg"
              alt="SBAA ULT FMIPA"
              width={30}
              height={30}
              className="size-8 object-contain"
            />
          </div>
          <div>
            <p className="text-lg font-extrabold leading-none text-slate-950">
              SBAA ULT FMIPA
            </p>
            <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Universitas Padjadjaran
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 items-start justify-center pb-8 pt-2 min-[400px]:pt-4 sm:pb-10 sm:pt-6 lg:items-center lg:py-0">
          <Suspense fallback={null}>
            <LoginForm
              pausMode={getPausMode()}
              pausLegacyLoginUrl={process.env.PAUS_LEGACY_LOGIN_URL}
            />
          </Suspense>
        </div>

        <p className="shrink-0 pt-5 text-center text-xs leading-6 text-stone-400 min-[400px]:pt-8 sm:text-sm sm:leading-7 lg:pt-2">
          © 2026 Unit Layanan Terpadu FMIPA
          <br />
          Universitas Padjadjaran.
        </p>
      </section>
    </main>
  );
}
