import Image from "next/image";
import { Suspense } from "react";

import { LoginForm } from "@/app/login/login-form";

function getPausMode() {
  return process.env.PAUS_MODE === "legacy" ? "legacy" : "modern";
}

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.45fr_1fr]">
      <section className="animate-login-media-in relative hidden overflow-hidden bg-slate-950 lg:block">
        <Image
          src="/gedung-fmipa.svg"
          alt="Gedung FMIPA Universitas Padjadjaran"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.12)_0%,rgba(15,23,42,0.28)_46%,rgba(15,23,42,0.76)_100%)]" />
      </section>

      <section className="animate-login-panel-in flex min-h-screen flex-col bg-white px-6 py-8 sm:px-10 lg:px-16">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
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

        <div className="flex flex-1 items-center justify-center">
          <Suspense fallback={null}>
            <LoginForm
              pausMode={getPausMode()}
              pausLegacyLoginUrl={process.env.PAUS_LEGACY_LOGIN_URL}
            />
          </Suspense>
        </div>

        <p className="pt-8 text-center text-sm leading-7 text-stone-400">
          © 2026 Unit Layanan Terpadu FMIPA
          <br />
          Universitas Padjadjaran.
        </p>
      </section>
    </main>
  );
}
