import Image from "next/image";
import { Suspense } from "react";

import { LoginForm } from "@/app/login/login-form";

function getPausMode() {
  return process.env.PAUS_MODE === "legacy" ? "legacy" : "modern";
}

export default function LoginPage() {
  return (
    <main
      className="login-root grid min-h-dvh bg-cover bg-center lg:h-dvh lg:grid-cols-[1.45fr_1fr] lg:overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.62)), url('/Beranda-Section1/gedung-fmipa.webp')",
      }}
    >
      <section className="login-media animate-login-media-in relative hidden h-dvh overflow-hidden bg-slate-950 lg:block">
        <Image
          src="/Beranda-Section1/gedung-fmipa.webp"
          alt="Gedung FMIPA Universitas Padjadjaran"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.12)_0%,rgba(15,23,42,0.28)_46%,rgba(15,23,42,0.76)_100%)]" />
      </section>

      <section className="login-panel animate-login-panel-in flex min-h-dvh min-w-0 flex-col overflow-x-hidden bg-transparent px-4 pb-2 pt-5 min-[400px]:px-6 sm:px-10 sm:py-8 lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:px-12 lg:py-4 xl:px-16">
        <div className="login-content-shell flex min-h-0 flex-none items-center justify-center sm:flex-1 sm:py-12 lg:py-0">
          <Suspense fallback={null}>
            <LoginForm
              pausMode={getPausMode()}
              pausLegacyLoginUrl={process.env.PAUS_LEGACY_LOGIN_URL}
            />
          </Suspense>
        </div>

        <p className="login-copyright mt-[35px] shrink-0 text-center text-xs leading-6 text-stone-400 sm:mt-0 sm:pt-8 sm:text-sm sm:leading-7 lg:pt-2">
          © 2026 Unit Layanan Terpadu FMIPA
          <br />
          Universitas Padjadjaran.
        </p>
      </section>
    </main>
  );
}
