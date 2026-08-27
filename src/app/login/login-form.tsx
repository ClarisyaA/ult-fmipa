"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getProviders, getSession, signIn } from "next-auth/react";
import type { ClientSafeProvider } from "next-auth/react";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSafeRedirectUrl } from "@/lib/auth-redirect";

type LoginFormProps = {
  pausMode: "modern" | "legacy";
  pausLegacyLoginUrl?: string;
};

export function LoginForm({ pausMode, pausLegacyLoginUrl }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accessMode, setAccessMode] = useState<"select" | "sivitas">("select");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [providers, setProviders] = useState<Record<
    string,
    ClientSafeProvider
  > | null>(null);

  // NextAuth redirects back here with ?error=... when the "paus" provider's
  // sign-in flow fails (including our student-only signIn callback
  // rejecting a profile without a valid NPM). Only a generic, safe message
  // is derived - never the raw NextAuth error code, NPM, email, or any PAUS
  // profile/token detail.
  const pausError = searchParams.get("error")
    ? "Login PAUS hanya tersedia untuk mahasiswa aktif dengan NPM yang valid."
    : "";

  useEffect(() => {
    getProviders().then(setProviders);

    getSession().then((session) => {
      if (session?.user.role) {
        router.replace(
          getSafeRedirectUrl(
            searchParams.get("callbackUrl"),
            session.user.role,
            window.location.origin,
          ),
        );
      }
    });
  }, [router, searchParams]);

  function getPostPausLoginCallback() {
    const callbackUrl = searchParams.get("callbackUrl");

    if (!callbackUrl) {
      return "/login";
    }

    return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  }

  function handleLegacyPausLogin() {
    if (pausLegacyLoginUrl) {
      window.location.href = pausLegacyLoginUrl;
    }
  }

  function handlePausLogin() {
    if (pausMode === "legacy") {
      handleLegacyPausLogin();
      return;
    }

    signIn("paus", {
      callbackUrl: getPostPausLoginCallback(),
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!result?.ok) {
      setError("Email atau password tidak sesuai.");
      setIsSubmitting(false);
      return;
    }

    const session = await getSession();

    if (session?.user.role) {
      router.replace(
        getSafeRedirectUrl(
          searchParams.get("callbackUrl"),
          session.user.role,
          window.location.origin,
        ),
      );
      return;
    }

    router.replace("/layanan");
  }

  if (accessMode === "select") {
    const isPausAvailable =
      (pausMode === "modern" && Boolean(providers?.paus)) ||
      (pausMode === "legacy" && Boolean(pausLegacyLoginUrl));

    return (
      <div
        key="select-access"
        data-login-mode="select"
        className="login-glass-panel login-access-glass animate-login-content-in relative w-full max-w-xs rounded-[1.5rem] p-4 sm:max-w-[38rem] sm:p-6 lg:h-[39rem] lg:max-w-[30rem] lg:p-4"
      >
        <nav
          aria-label="Navigasi login"
          className="relative top-2 mb-4 pb-2 sm:top-0 sm:mb-10 sm:pb-4 lg:mb-5 lg:pb-2"
        >
          <Link
            href="/"
            className="login-back-link inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Kembali ke Beranda
          </Link>
        </nav>
        <div className="mb-4 text-center sm:mb-7 lg:mb-5">
          <h2 className="text-xl font-extrabold tracking-normal text-white sm:text-[2rem]">
            Pilih Akses Layanan
          </h2>
          <p className="mt-2 text-xs font-medium text-white/75 sm:mt-3 sm:text-sm">
            Silakan pilih kategori pengguna untuk melanjutkan.
          </p>
        </div>

        {pausError ? (
          <p className="mx-auto mb-4 max-w-[26rem] rounded-xl border border-[#d6001c]/25 bg-[#d6001c]/8 px-4 py-3 text-center text-xs font-medium text-white sm:text-sm">
            {pausError}
          </p>
        ) : null}

        <div className="mx-auto mt-[35px] grid w-full max-w-[26rem] gap-3 px-3 sm:mt-0 sm:gap-4 sm:px-0 lg:gap-3">
          <article className="login-access-card group relative overflow-hidden rounded-xl p-3 transition-all hover:-translate-y-1 sm:rounded-2xl sm:p-4 lg:p-2.5">
            <h3 className="text-center text-lg font-extrabold text-white sm:hidden">
              Mahasiswa
            </h3>
            <div className="grid gap-2 sm:grid-cols-[1fr_0.9fr] sm:items-center sm:gap-4 lg:grid-cols-[1fr_0.72fr] lg:gap-3">
              <div className="order-2 px-1 text-center sm:order-1 sm:text-left">
                <h3 className="hidden text-xl font-extrabold text-white sm:block lg:text-lg">
                  Mahasiswa
                </h3>
                <p className="mt-1 text-xs font-medium leading-5 text-white/75 sm:mt-2 sm:text-sm sm:leading-6 lg:mt-1 lg:text-xs lg:leading-5">
                  Gunakan akun PAUS Unpad mahasiswa untuk mengakses layanan
                  akademik terpadu.
                </p>
                <Button
                  type="button"
                  disabled={!isPausAvailable}
                  className="mt-3 h-10 w-full rounded-xl bg-[#df001d] text-xs font-extrabold text-white shadow-lg shadow-[#df001d]/20 transition-all hover:-translate-y-0.5 hover:bg-[#c9001a] hover:text-white disabled:opacity-60 disabled:hover:translate-y-0 sm:mt-5 sm:h-11 sm:text-sm lg:mt-3 lg:h-9 lg:text-xs"
                  onClick={handlePausLogin}
                >
                  Masuk sebagai Mahasiswa
                </Button>
              </div>
              <div className="order-1 flex h-full items-end justify-center self-stretch sm:order-2">
                <Image
                  src="/login/mahasiswa.webp"
                  alt="Ilustrasi login mahasiswa"
                  width={360}
                  height={245}
                  className="-mb-3 h-32 w-full object-contain object-bottom transition-transform duration-300 group-hover:scale-[1.03] sm:-mb-4 sm:h-52 lg:-mb-2.5 lg:h-36"
                />
              </div>
            </div>
          </article>

          <article className="login-access-card group relative overflow-hidden rounded-xl p-3 transition-all hover:-translate-y-1 sm:rounded-2xl sm:p-4 lg:p-2.5">
            <h3 className="text-center text-lg font-extrabold text-white sm:hidden">
              Admin/Staff
            </h3>
            <div className="grid gap-2 sm:grid-cols-[1fr_0.9fr] sm:items-center sm:gap-4 lg:grid-cols-[1fr_0.72fr] lg:gap-3">
              <div className="order-2 px-1 text-center sm:order-1 sm:text-left">
                <h3 className="hidden text-xl font-extrabold text-white sm:block lg:text-lg">
                  Admin/Staff
                </h3>
                <p className="mt-1 text-xs font-medium leading-5 text-white/75 sm:mt-2 sm:text-sm sm:leading-6 lg:mt-1 lg:text-xs lg:leading-5">
                  Gunakan akun internal ULT FMIPA Unpad untuk Admin maupun
                  Staff.
                </p>
                <Button
                  type="button"
                  className="mt-3 h-10 w-full rounded-xl bg-[#df001d] text-xs font-extrabold text-white shadow-lg shadow-[#df001d]/20 transition-all hover:-translate-y-0.5 hover:bg-[#c9001a] hover:text-white sm:mt-5 sm:h-11 sm:text-sm lg:mt-3 lg:h-9 lg:text-xs"
                  onClick={() => setAccessMode("sivitas")}
                >
                  Masuk sebagai Admin/Staff
                </Button>
              </div>
              <div className="order-1 flex h-full items-end justify-center self-stretch sm:order-2">
                <Image
                  src="/login/sivitas.webp"
                  alt="Ilustrasi login Admin/Staff"
                  width={360}
                  height={245}
                  className="-mb-3 h-32 w-full object-contain object-bottom transition-transform duration-300 group-hover:scale-[1.03] sm:-mb-4 sm:h-52 lg:-mb-2.5 lg:h-36"
                />
              </div>
            </div>
          </article>
        </div>

        <p className="mt-5 text-center text-[0.68rem] leading-5 text-white/60 sm:mt-6 sm:text-xs sm:leading-6 lg:mt-4">
          © 2026 Unit Layanan Terpadu FMIPA
          <br />
          Universitas Padjadjaran.
        </p>
      </div>
    );
  }

  return (
    <div
      key="administrator-login"
      data-login-mode="administrator"
      className="login-glass-panel login-admin-glass animate-login-content-in relative w-full max-w-xs rounded-[1.5rem] p-4 sm:max-w-[38rem] sm:p-6 lg:h-[39rem] lg:max-w-[30rem] lg:p-4"
    >
      <nav
        aria-label="Navigasi login"
        className="mx-auto mb-9 flex w-full max-w-[26rem] flex-wrap items-center justify-between gap-x-5 gap-y-2 px-3 sm:px-0"
      >
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white transition-colors hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:gap-2 sm:text-sm"
          onClick={() => setAccessMode("select")}
        >
          <ArrowLeft className="size-3.5 sm:size-4" aria-hidden="true" />
          Pilih akses lain
        </button>
        <Link
          href="/"
          className="inline-flex items-center text-xs font-bold text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:text-sm"
        >
          Beranda
        </Link>
      </nav>

      <div className="mx-auto w-full max-w-[26rem] px-3 sm:px-0">
        <div className="mb-5 sm:mb-9">
          <h2 className="text-xl font-extrabold tracking-normal text-white sm:text-3xl">
            Selamat Datang Kembali
          </h2>
          <p className="mt-2 text-sm text-white/75 sm:mt-3 sm:text-base">
            Masuk dengan akun Anda untuk melanjutkan.
          </p>
        </div>

        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label
              htmlFor="email"
              className="text-xs font-bold tracking-[0.04em] text-white/85 sm:text-sm"
            >
              Username
            </Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-[18px] -translate-y-1/2 text-white sm:left-4 sm:size-5" />
              <Input
                id="email"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="login-field h-12 rounded-xl border-white/40 bg-slate-950/45 pl-11 pr-4 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_24px_rgba(2,6,23,0.2)] backdrop-blur-xl focus-visible:border-white/80 focus-visible:ring-white/25 sm:h-14 sm:pl-14 sm:text-base"
                data-testid="login-email"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-4">
              <Label
                htmlFor="password"
                className="text-xs font-bold tracking-[0.04em] text-white/85 sm:text-sm"
              >
                Password
              </Label>
              <button
                type="button"
                className="text-xs font-bold text-red-200 transition-colors hover:text-white sm:text-sm"
              >
                Lupa Kata Sandi?
              </button>
            </div>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-[18px] -translate-y-1/2 text-white sm:left-4 sm:size-5" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="login-field h-12 rounded-xl border-white/40 bg-slate-950/45 pl-11 pr-12 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_24px_rgba(2,6,23,0.2)] backdrop-blur-xl focus-visible:border-white/80 focus-visible:ring-white/25 sm:h-14 sm:pl-14 sm:pr-14 sm:text-base"
                data-testid="login-password"
              />
              <button
                type="button"
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
                className="absolute right-3.5 top-1/2 z-10 -translate-y-1/2 text-white/70 transition-colors hover:text-white sm:right-4"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? (
                  <EyeOff className="size-[18px] sm:size-5" />
                ) : (
                  <Eye className="size-[18px] sm:size-5" />
                )}
              </button>
            </div>
          </div>

          <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-white/85 sm:gap-2.5 sm:text-sm">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="size-3.5 rounded border-[#efb9b3] text-[#d6001c] accent-[#d6001c] sm:size-4"
            />
            Ingat saya di perangkat ini
          </label>

          {error ? (
            <p className="rounded-xl border border-[#d6001c]/25 bg-[#d6001c]/8 px-4 py-3 text-sm font-medium text-[#b00017]">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 h-12 rounded-xl bg-[#df001d] text-base font-extrabold text-white shadow-lg shadow-[#df001d]/20 transition-all hover:-translate-y-0.5 hover:bg-[#c9001a] disabled:hover:translate-y-0 sm:h-16 sm:text-xl"
            data-testid="login-submit"
          >
            {isSubmitting ? "Memproses..." : "Masuk Sekarang"}
          </Button>
        </form>
      </div>
    </div>
  );
}
